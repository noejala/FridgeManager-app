import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { Product } from './types/Product';
import { supabase } from './lib/supabase';
import { fetchProducts, fetchRecentlyConsumed, insertProduct, updateProduct, deleteProduct, deleteAllProducts, consumeProduct, restoreProduct } from './utils/productService';
import { isExpired, isExpiringSoon } from './utils/storage';
import { getFridgeZone } from './utils/fridgePlacement';
import { estimateExpirationFromOpenDate } from './utils/shelfLife';
import { Tabs } from './components/Tabs';
import { AddProductForm } from './components/AddProductForm';
import { EditProductForm } from './components/EditProductForm';
import { ProductList } from './components/ProductList';
import { DuplicateModal } from './components/DuplicateModal';
import { useProductNotifications } from './hooks/useProductNotifications';
import { WhatToCook } from './components/WhatToCook';
import { SeasonalProducts } from './components/SeasonalProducts';
import { UserSettings } from './components/UserSettings';
import { Auth } from './components/Auth';
import { InstallBanner } from './components/InstallBanner';
import { NotifPermissionModal } from './components/NotifPermissionModal';
import './App.css';

const TAB_STORAGE_KEY = 'lastActiveTab';
const TAB_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getSavedTab(): string {
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY);
    if (!raw) return 'fridge';
    const { tab, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < TAB_EXPIRY_MS) return tab;
  } catch {
    // ignore
  }
  return 'fridge';
}

function App() {
  const { t } = useTranslation();
  const { permission, requestPermission, checkAndNotify } = useProductNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [consumedProducts, setConsumedProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('fridge');
  const [notification, setNotification] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Omit<Product, 'id' | 'addedDate'> | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setScrolledDown(current > lastScrollY.current && current > 60);
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const loadUserProducts = useCallback(async () => {
    try {
      const [data, consumed] = await Promise.all([fetchProducts(), fetchRecentlyConsumed()]);
      setProducts(data);
      setConsumedProducts(consumed);
      checkAndNotify(data, t);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, [checkAndNotify, t]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProducts();
      setActiveTab(getSavedTab());
    } else {
      setProducts([]);
    }
  }, [user, loadUserProducts]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({ tab: activeTab, timestamp: Date.now() }));
    }
  }, [activeTab, user]);

  const doInsertProduct = async (productData: Omit<Product, 'id' | 'addedDate'>) => {
    if (!user) return;
    const fridgeZone = getFridgeZone(productData.name, productData.category);
    const productWithMeta = {
      ...productData,
      addedDate: new Date().toISOString().split('T')[0],
      fridgeZone,
    };
    const saved = await insertProduct(productWithMeta, user.id);
    setProducts(prev => [saved, ...prev]);
    setNotification(t('app.placeIn', { name: productData.name, zone: fridgeZone }));
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'addedDate'>) => {
    if (!user) return;
    const duplicate = products.find(
      p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase()
    );
    if (duplicate) {
      setPendingProduct(productData);
      return;
    }
    try {
      await doInsertProduct(productData);
    } catch (err) {
      console.error('Failed to add product:', err);
    }
  };

  const handleGroupProducts = async () => {
    if (!pendingProduct || !user) return;
    const existing = products.find(
      p => p.name.trim().toLowerCase() === pendingProduct.name.trim().toLowerCase()
    );
    if (!existing) return;
    const merged: Product = {
      ...existing,
      quantity: existing.quantity + pendingProduct.quantity,
      expirationDate: existing.expirationDate >= pendingProduct.expirationDate
        ? existing.expirationDate
        : pendingProduct.expirationDate,
      isEstimatedExpiration: pendingProduct.isEstimatedExpiration ?? existing.isEstimatedExpiration,
    };
    try {
      await updateProduct(merged);
      setProducts(prev => prev.map(p => p.id === merged.id ? merged : p));
      setPendingProduct(null);
    } catch (err) {
      console.error('Failed to group products:', err);
    }
  };

  const handleReplaceProduct = async () => {
    if (!pendingProduct || !user) return;
    const existing = products.find(
      p => p.name.trim().toLowerCase() === pendingProduct.name.trim().toLowerCase()
    );
    if (!existing) return;
    try {
      await deleteProduct(existing.id);
      setProducts(prev => prev.filter(p => p.id !== existing.id));
      await doInsertProduct(pendingProduct);
      setPendingProduct(null);
    } catch (err) {
      console.error('Failed to replace product:', err);
    }
  };

  const handleAddSeparately = async () => {
    if (!pendingProduct) return;
    try {
      await doInsertProduct(pendingProduct);
      setPendingProduct(null);
    } catch (err) {
      console.error('Failed to add product separately:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleConsumeProduct = async (id: string) => {
    try {
      await consumeProduct(id);
      const consumed = products.find(p => p.id === id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (consumed) {
        setConsumedProducts(prev => [{ ...consumed, consumedAt: new Date().toISOString() }, ...prev]);
      }
    } catch (err) {
      console.error('Failed to consume product:', err);
    }
  };

  const handleDeleteConsumed = async (id: string) => {
    try {
      await deleteProduct(id);
      setConsumedProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete consumed product:', err);
    }
  };

  const handleRestoreProduct = async (id: string) => {
    try {
      await restoreProduct(id);
      const restored = consumedProducts.find(p => p.id === id);
      setConsumedProducts(prev => prev.filter(p => p.id !== id));
      if (restored) {
        const { consumedAt: _, ...restoredProduct } = restored;
        setProducts(prev => [restoredProduct, ...prev]);
      }
    } catch (err) {
      console.error('Failed to restore product:', err);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      await updateProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleOpenSauce = async (id: string, openedDate: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const updatedProduct: Product = {
      ...product,
      openedDate,
      expirationDate: estimateExpirationFromOpenDate(product.name, openedDate),
      isEstimatedExpiration: true,
    };
    await handleUpdateProduct(updatedProduct);
  };

  const handleClearFridge = async () => {
    try {
      await deleteAllProducts();
      setProducts([]);
    } catch (err) {
      console.error('Failed to clear fridge:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderTabContent = () => (
    <>
      <div hidden={activeTab !== 'add-product'}>
        <AddProductForm
          onAdd={async (data) => { await handleAddProduct(data); setActiveTab('fridge'); }}
          isFormOpen={true}
          onFormOpenChange={() => setActiveTab('fridge')}
        />
      </div>
      <div hidden={activeTab !== 'fridge'}>
        {editingProduct ? (
          <EditProductForm
            product={editingProduct}
            onSave={handleUpdateProduct}
            onCancel={handleCancelEdit}
          />
        ) : (
          <AddProductForm
            onAdd={handleAddProduct}
            isFormOpen={false}
            onFormOpenChange={(open) => open && setActiveTab('add-product')}
          />
        )}
        <ProductList
          products={products}
          consumedProducts={consumedProducts}
          onDelete={handleDeleteProduct}
          onConsume={handleConsumeProduct}
          onRestore={handleRestoreProduct}
          onDeleteConsumed={handleDeleteConsumed}
          onEdit={handleEditProduct}
          onOpenSauce={handleOpenSauce}
          onClearAll={handleClearFridge}
        />
      </div>
      <div hidden={activeTab !== 'cook'}>
        <WhatToCook products={products} />
      </div>
      <div hidden={activeTab !== 'seasonal'}>
        <SeasonalProducts />
      </div>
      <div hidden={activeTab !== 'settings'}>
        <UserSettings
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onLogout={handleLogout}
        />
      </div>
    </>
  );

  if (authLoading) return null;

  if (!user) return <Auth darkMode={darkMode} onToggleDarkMode={() => setDarkMode(prev => !prev)} />;

  return (
    <div className="app">
      <header className={`app-header${scrolledDown || activeTab === 'add-product' ? ' header-hidden' : ''}`}>
        <div className="app-header-controls">
          {permission === 'default' && (
            <button
              className="notif-btn"
              onClick={requestPermission}
              title={t('notifications.enable')}
            >
              🔔
            </button>
          )}
        </div>
        <h1>Fridge <span>Manager</span></h1>
        <div className="app-header-rule" />
        <p>{t('app.subtitle')}</p>
      </header>

      <main className="app-main">
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          urgentCount={products.filter(p => isExpired(p.expirationDate) || isExpiringSoon(p.expirationDate)).length}
          scrolledDown={scrolledDown || activeTab === 'add-product'}
        >
          {renderTabContent()}
        </Tabs>
      </main>
      {notification && (
        <div className="toast-notification">{notification}</div>
      )}
      <NotifPermissionModal permission={permission} onRequest={requestPermission} />
      <InstallBanner />
      {pendingProduct && (
        <DuplicateModal
          existing={products.find(
            p => p.name.trim().toLowerCase() === pendingProduct.name.trim().toLowerCase()
          )!}
          incoming={pendingProduct}
          onCancel={() => setPendingProduct(null)}
          onGroup={handleGroupProducts}
          onReplace={handleReplaceProduct}
          onAddSeparately={handleAddSeparately}
        />
      )}
    </div>
  );
}

export default App;

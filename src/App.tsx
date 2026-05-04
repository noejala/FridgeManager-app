import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { Product } from './types/Product';
import { supabase } from './lib/supabase';
import { fetchProducts, fetchRecentlyConsumed, insertProduct, updateProduct, deleteProduct, deleteAllProducts, consumeProduct, restoreProduct } from './utils/productService';
import { lookupBarcode, FoodFactsResult } from './utils/foodFactsApi';
import { fetchUserProfile, saveUserProfile } from './utils/userProfileService';
import { DietaryPreference } from './types/UserProfile';
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
import { PantryOnboarding } from './components/PantryOnboarding';
import { VoiceInput } from './components/VoiceInput';
import { VoiceDraftReview } from './components/VoiceDraftReview';
import { DraftProduct } from './utils/voiceParser';
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
  const [modalKey, setModalKey] = useState(0);
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
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [customPreferences, setCustomPreferences] = useState<string>('');
  const [pantryStaples, setPantryStaples] = useState<string[]>([]);
  const [showPantryOnboarding, setShowPantryOnboarding] = useState(false);
  const [scanPrefill, setScanPrefill] = useState<FoodFactsResult | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState<DraftProduct[] | null>(null);
  const [voiceTried, setVoiceTried] = useState(() => localStorage.getItem('voice-tried') === '1');
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
    if (!editingProduct) return;
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [editingProduct]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = darkMode ? '#0f1117' : '#f5f5f5';
    document.head.appendChild(meta);
  }, [darkMode]);

  const loadUserProducts = useCallback(async (userId?: string) => {
    try {
      const [data, consumed, profile] = await Promise.all([
        fetchProducts(),
        fetchRecentlyConsumed(),
        fetchUserProfile(),
      ]);
      setProducts(data);
      setConsumedProducts(consumed);
      setDietaryPreferences(profile?.dietaryPreferences ?? []);
      setDislikedIngredients(profile?.dislikedIngredients ?? []);
      setCustomPreferences(profile?.customPreferences ?? '');
      const staples = profile?.pantryStaples ?? [];
      setPantryStaples(staples);
      // Show onboarding if staples never set and user hasn't dismissed it
      if (staples.length === 0 && userId) {
        const key = `pantry-onboarding-seen-${userId}`;
        if (!localStorage.getItem(key)) {
          setShowPantryOnboarding(true);
        }
      }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        // Only clear snooze on login — "never" persists across sessions
        localStorage.removeItem('notif-permission-snoozed-until');
        setModalKey(k => k + 1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserProducts(user.id);
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
    const computed = estimateExpirationFromOpenDate(product.name, openedDate);
    // The label on the jar is always the upper bound
    const newExpiration = computed < product.expirationDate ? computed : product.expirationDate;
    const updatedProduct: Product = {
      ...product,
      openedDate,
      expirationDate: newExpiration,
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

  const dismissPantryOnboarding = (userId: string) => {
    localStorage.setItem(`pantry-onboarding-seen-${userId}`, '1');
    setShowPantryOnboarding(false);
  };

  const handlePantryOnboardingConfirm = async (staples: string[]) => {
    if (!user) return;
    setPantryStaples(staples);
    const profile = await fetchUserProfile();
    await saveUserProfile({
      country: null, gender: null, age: null,
      dietaryPreferences: [], dislikedIngredients: [], customPreferences: '',
      ...profile,
      pantryStaples: staples,
    });
    dismissPantryOnboarding(user.id);
  };

  const handlePantryOnboardingSkip = () => {
    if (!user) return;
    dismissPantryOnboarding(user.id);
  };

  const handleLogout = async () => {
    localStorage.removeItem(TAB_STORAGE_KEY);
    await supabase.auth.signOut();
  };

  const handleFridgeBarcode = useCallback(async (barcode: string) => {
    setActiveTab('add-product');
    const result = await lookupBarcode(barcode);
    setScanPrefill(result);
  }, []);

  const handleVoiceConfirm = async (drafts: Array<Omit<DraftProduct, '_draftId'>>) => {
    if (!user) return;
    try {
      const added: Product[] = [];
      for (const draft of drafts) {
        const fridgeZone = getFridgeZone(draft.name, draft.category);
        const saved = await insertProduct({
          ...draft,
          expirationDate: draft.expirationDate!,
          addedDate: new Date().toISOString().split('T')[0],
          fridgeZone,
        }, user.id);
        added.push(saved);
      }
      setProducts(prev => [...added, ...prev]);
      setVoiceDraft(null);
      setNotification(t('voice.addedSuccess', { count: added.length }));
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to add voice products:', err);
    }
  };

  const renderTabContent = () => (
    <>
      <div hidden={activeTab !== 'add-product'}>
        <AddProductForm
          onAdd={async (data) => { await handleAddProduct(data); setActiveTab('fridge'); }}
          isFormOpen={true}
          onFormOpenChange={() => setActiveTab('fridge')}
          prefill={scanPrefill}
          onPrefillApplied={() => setScanPrefill(null)}
          onVoiceStart={() => setIsVoiceMode(true)}
          voiceTried={voiceTried}
        />
      </div>
      {editingProduct && (
        <div className="edit-modal-backdrop" onClick={handleCancelEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <EditProductForm
              product={editingProduct}
              onSave={handleUpdateProduct}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}
      <div hidden={activeTab !== 'fridge'}>
        <AddProductForm
          onAdd={handleAddProduct}
          isFormOpen={false}
          onFormOpenChange={(open) => open && setActiveTab('add-product')}
          onScanBarcode={handleFridgeBarcode}
          onVoiceStart={() => setIsVoiceMode(true)}
          voiceTried={voiceTried}
        />
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
        <WhatToCook
          products={products}
          dietaryPreferences={dietaryPreferences}
          dislikedIngredients={dislikedIngredients}
          customPreferences={customPreferences}
          pantryStaples={pantryStaples}
          onConsumeProducts={(ids) => ids.forEach(id => handleConsumeProduct(id))}
        />
      </div>
      <div hidden={activeTab !== 'seasonal'}>
        <SeasonalProducts isActive={activeTab === 'seasonal'} />
      </div>
      <div hidden={activeTab !== 'settings'}>
        <UserSettings
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onLogout={handleLogout}
          onDietaryPreferencesChange={setDietaryPreferences}
          onDislikedIngredientsChange={setDislikedIngredients}
          onCustomPreferencesChange={setCustomPreferences}
          onPantryStaplesChange={setPantryStaples}
          pantryStaples={pantryStaples}
        />
      </div>
    </>
  );

  if (authLoading) return null;

  if (!user) return <Auth darkMode={darkMode} onToggleDarkMode={() => setDarkMode(prev => !prev)} />;

  return (
    <div className="app">
      <header className={`app-header${scrolledDown ? ' header-hidden' : ''}`}>
        <div className="app-header-controls">
          {permission !== 'granted' && (
            <button
              className="notif-btn"
              onClick={() => {
                localStorage.removeItem('notif-permission-dismissed');
                localStorage.removeItem('notif-permission-snoozed-until');
                setModalKey(k => k + 1);
                requestPermission();
              }}
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
          scrolledDown={scrolledDown}
        >
          {renderTabContent()}
        </Tabs>
      </main>
      {notification && (
        <div className="toast-notification">{notification}</div>
      )}
      <NotifPermissionModal key={modalKey} permission={permission} onRequest={requestPermission} />
      <InstallBanner />
      {showPantryOnboarding && (
        <PantryOnboarding
          onConfirm={handlePantryOnboardingConfirm}
          onSkip={handlePantryOnboardingSkip}
        />
      )}
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
      {isVoiceMode && (
        <VoiceInput
          onDraftReady={(drafts) => {
            setIsVoiceMode(false);
            setVoiceDraft(drafts);
            if (!voiceTried) { setVoiceTried(true); localStorage.setItem('voice-tried', '1'); }
          }}
          onClose={() => setIsVoiceMode(false)}
        />
      )}
      {voiceDraft && (
        <VoiceDraftReview
          drafts={voiceDraft}
          onConfirm={handleVoiceConfirm}
          onCancel={() => setVoiceDraft(null)}
        />
      )}
    </div>
  );
}

export default App;

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Product } from './types/Product';
import { supabase } from './lib/supabase';
import { fetchProducts, insertProduct, updateProduct, deleteProduct } from './utils/productService';
import { getFridgeZone } from './utils/fridgePlacement';
import { Tabs } from './components/Tabs';
import { AddProductForm } from './components/AddProductForm';
import { EditProductForm } from './components/EditProductForm';
import { ProductList } from './components/ProductList';
import { WhatToCook } from './components/WhatToCook';
import { SeasonalProducts } from './components/SeasonalProducts';
import { Auth } from './components/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('fridge');
  const [notification, setNotification] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const loadUserProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

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
    } else {
      setProducts([]);
    }
  }, [user, loadUserProducts]);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'addedDate'>) => {
    if (!user) return;
    const fridgeZone = getFridgeZone(productData.name, productData.category);
    const productWithMeta = {
      ...productData,
      addedDate: new Date().toISOString().split('T')[0],
      fridgeZone,
    };
    try {
      const saved = await insertProduct(productWithMeta, user.id);
      setProducts(prev => [saved, ...prev]);
      setNotification(`Place ${productData.name} in: ${fridgeZone}`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to add product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fridge':
        return (
          <>
            {editingProduct ? (
              <EditProductForm
                product={editingProduct}
                onSave={handleUpdateProduct}
                onCancel={handleCancelEdit}
              />
            ) : (
              <AddProductForm onAdd={handleAddProduct} />
            )}
            <ProductList
              products={products}
              onDelete={handleDeleteProduct}
              onEdit={handleEditProduct}
            />
          </>
        );
      case 'cook':
        return <WhatToCook products={products} />;
      case 'seasonal':
        return <SeasonalProducts />;
      default:
        return null;
    }
  };

  if (authLoading) return null;

  if (!user) return <Auth />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-controls">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(prev => !prev)}
            title={darkMode ? 'Mode jour' : 'Mode nuit'}
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
        <h1>Fridge <span>Manager</span></h1>
        <div className="app-header-rule" />
        <p>Manage your products and never waste food again</p>
      </header>

      <main className="app-main">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
          {renderTabContent()}
        </Tabs>
      </main>
      {notification && (
        <div className="toast-notification">{notification}</div>
      )}
    </div>
  );
}

export default App;

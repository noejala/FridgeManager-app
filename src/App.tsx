import { useState, useEffect } from 'react';
import { Product } from './types/Product';
import { saveProducts, loadProducts } from './utils/storage';
import { getFridgeZone } from './utils/fridgePlacement';
import { Tabs } from './components/Tabs';
import { AddProductForm } from './components/AddProductForm';
import { EditProductForm } from './components/EditProductForm';
import { ProductList } from './components/ProductList';
import { WhatToCook } from './components/WhatToCook';
import { SeasonalProducts } from './components/SeasonalProducts';
import './App.css';

function App() {
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

  useEffect(() => {
    const loadedProducts = loadProducts();
    setProducts(loadedProducts);
  }, []);

  useEffect(() => {
    if (products.length > 0 || loadProducts().length > 0) {
      saveProducts(products);
    }
  }, [products]);

  const handleAddProduct = (productData: Omit<Product, 'id' | 'addedDate'>) => {
    const fridgeZone = getFridgeZone(productData.name, productData.category);
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      addedDate: new Date().toISOString().split('T')[0],
      fridgeZone
    };
    setProducts(prev => [...prev, newProduct]);
    setNotification(`Place ${productData.name} in: ${fridgeZone}`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
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

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(prev => !prev)}
          title={darkMode ? 'Mode jour' : 'Mode nuit'}
        >
          {darkMode ? '☀' : '☾'}
        </button>
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


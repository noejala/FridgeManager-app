import { useState, useEffect } from 'react';
import { Product } from './types/Product';
import { saveProducts, loadProducts } from './utils/storage';
import { AddProductForm } from './components/AddProductForm';
import { ProductList } from './components/ProductList';
import './App.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);

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
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      addedDate: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧊 Fridge Manager</h1>
        <p>Gérez vos produits et ne gaspillez plus jamais !</p>
      </header>
      
      <main className="app-main">
        <AddProductForm onAdd={handleAddProduct} />
        <ProductList products={products} onDelete={handleDeleteProduct} />
      </main>
    </div>
  );
}

export default App;


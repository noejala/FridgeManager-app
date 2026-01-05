import { useState } from 'react';
import { Product, ProductCategory } from '../types/Product';
import './AddProductForm.css';

interface AddProductFormProps {
  onAdd: (product: Omit<Product, 'id' | 'addedDate'>) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Fruits',
  'Légumes',
  'Viande',
  'Poisson',
  'Produits laitiers',
  'Boissons',
  'Surgelés',
  'Autre'
];

export const AddProductForm = ({ onAdd }: AddProductFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Autre');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState('unité');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expirationDate) return;

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      alert('La quantité doit être un nombre supérieur ou égal à 1');
      return;
    }

    onAdd({
      name: name.trim(),
      category,
      expirationDate,
      quantity: quantityNum,
      unit
    });

    // Reset form
    setName('');
    setCategory('Autre');
    setExpirationDate('');
    setQuantity('1');
    setUnit('unité');
    setIsOpen(false);
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!isOpen) {
    return (
      <button className="add-product-btn" onClick={() => setIsOpen(true)}>
        + Ajouter un produit
      </button>
    );
  }

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Ajouter un produit</h2>
      
      <div className="form-group">
        <label htmlFor="name">Nom du produit *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Lait, Pommes, Poulet..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantité</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '' || Number(value) < 1) {
                setQuantity('1');
              }
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="unit">Unité</label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="unité">unité</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="mL">mL</option>
            <option value="paquet">paquet</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="expirationDate">Date d'expiration *</label>
        <input
          id="expirationDate"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          min={minDate}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={() => setIsOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="submit-btn">
          Ajouter
        </button>
      </div>
    </form>
  );
};


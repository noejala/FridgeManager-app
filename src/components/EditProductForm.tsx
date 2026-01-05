import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../types/Product';
import './AddProductForm.css';

interface EditProductFormProps {
  product: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Fruits',
  'Vegetables',
  'Meat',
  'Fish',
  'Dairy',
  'Beverages',
  'Frozen',
  'Other'
];

export const EditProductForm = ({ product, onSave, onCancel }: EditProductFormProps) => {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState<ProductCategory>(product.category as ProductCategory);
  const [expirationDate, setExpirationDate] = useState(product.expirationDate);
  const [quantity, setQuantity] = useState<string>(product.quantity.toString());
  const [unit, setUnit] = useState(product.unit);

  useEffect(() => {
    // Réinitialiser le formulaire si le produit change
    setName(product.name);
    setCategory(product.category as ProductCategory);
    setExpirationDate(product.expirationDate);
    setQuantity(product.quantity.toString());
    setUnit(product.unit);
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expirationDate) return;

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum < 1) {
      alert('Quantity must be a number greater than or equal to 1');
      return;
    }

    onSave({
      ...product,
      name: name.trim(),
      category,
      expirationDate,
      quantity: quantityNum,
      unit
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>Edit product</h2>
      
      <div className="form-group">
        <label htmlFor="edit-name">Product name *</label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Milk, Apples, Chicken..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-category">Category</label>
          <select
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="edit-quantity">Quantity</label>
          <input
            id="edit-quantity"
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
          <label htmlFor="edit-unit">Unit</label>
          <select
            id="edit-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="unit">unit</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="mL">mL</option>
            <option value="pack">pack</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="edit-expirationDate">Expiration date *</label>
        <input
          id="edit-expirationDate"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          min={minDate}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          Save
        </button>
      </div>
    </form>
  );
};


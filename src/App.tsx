import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { Product } from './types/Product';
import { Fridge } from './types/Fridge';
import { supabase } from './lib/supabase';
import { fetchProducts, fetchRecentlyConsumed, insertProduct, updateProduct, deleteProduct, deleteAllProducts, consumeProduct, restoreProduct } from './utils/productService';
import { fetchFridges, createFridge, acceptFridgeInvite, updateFridgePantry } from './utils/fridgeService';
import { fetchPendingIncomingCount } from './utils/friendService';
import { lookupBarcode, FoodFactsResult } from './utils/foodFactsApi';
import { fetchUserProfile } from './utils/userProfileService';
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
import { UsernameSetup } from './components/UsernameSetup';
import { SharingTab } from './components/SharingTab';
import { InstallBanner } from './components/InstallBanner';
import { NotifPermissionModal } from './components/NotifPermissionModal';
import { PantryOnboarding } from './components/PantryOnboarding';
import { VoiceInput } from './components/VoiceInput';
import { VoiceDraftReview } from './components/VoiceDraftReview';
import { FridgeSwitcher } from './components/FridgeSwitcher';
import { PantryPanel } from './components/PantryPanel';
import { DraftProduct } from './utils/voiceParser';
import './App.css';

const TAB_STORAGE_KEY = 'lastActiveTab';
const TAB_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVE_FRIDGE_KEY = 'active-fridge-id';

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
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [activeFridgeId, setActiveFridgeId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [consumedProducts, setConsumedProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('fridge');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set());
  const [newFridgeId, setNewFridgeId] = useState<string | null>(null);
  const [copyPantryPrompt, setCopyPantryPrompt] = useState<{ targetFridgeId: string; name: string; emoji: string; staples: string[] } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Omit<Product, 'id' | 'addedDate'> | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [customPreferences, setCustomPreferences] = useState<string>('');
  const [kitchenEquipment, setKitchenEquipment] = useState<string[]>([]);
  const [showPantry, setShowPantry] = useState(false);
  const [displayName, setDisplayName] = useState<string | null | undefined>(undefined);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [showPantryOnboarding, setShowPantryOnboarding] = useState(false);
  const [scanPrefill, setScanPrefill] = useState<FoodFactsResult | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState<DraftProduct[] | null>(null);
  const [voiceTried, setVoiceTried] = useState(() => localStorage.getItem('voice-tried') === '1');
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollAccumulator = useRef(0);
  const pantryAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading) {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 350);
      }
    }
  }, [authLoading]);

  // Capture invite token from URL on mount before anything else
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      sessionStorage.setItem('pending-invite-token', token);
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      lastScrollY.current = current;

      if (current <= 60 || delta < 0) {
        // Near top or scrolling up: show immediately
        scrollAccumulator.current = 0;
        setScrolledDown(false);
      } else {
        // Scrolling down: require 30px accumulated before hiding
        scrollAccumulator.current += delta;
        if (scrollAccumulator.current > 30) {
          setScrolledDown(true);
        }
      }
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

  const showNotification = useCallback((msg: string, durationMs = 4000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), durationMs);
  }, []);

  const loadUserData = useCallback(async (userId?: string) => {
    try {
      // Process pending invite first so the new fridge appears in the list
      const inviteToken = sessionStorage.getItem('pending-invite-token');
      let inviteSuccess: string | null = null;
      if (inviteToken) {
        sessionStorage.removeItem('pending-invite-token');
        try {
          const { fridgeName } = await acceptFridgeInvite(inviteToken);
          inviteSuccess = fridgeName;
        } catch {
          showNotification(t('fridges.inviteInvalid'));
        }
      }

      const [fetchedFridges, profile] = await Promise.all([
        fetchFridges(),
        fetchUserProfile(),
      ]);

      let fridgeList = fetchedFridges;
      if (fridgeList.length === 0 && profile?.displayName) {
        const defaultFridge = await createFridge(`Frigo de ${profile.displayName}`);
        fridgeList = [defaultFridge];
      }
      // If fridgeList is still empty: new user without a username yet — fridge created after UsernameSetup

      setFridges(fridgeList);

      const savedId = localStorage.getItem(ACTIVE_FRIDGE_KEY);
      const resolvedId = fridgeList.find(f => f.id === savedId)?.id ?? fridgeList[0]?.id ?? '';
      if (resolvedId) {
        setActiveFridgeId(resolvedId);
        localStorage.setItem(ACTIVE_FRIDGE_KEY, resolvedId);
      }

      if (inviteSuccess) {
        showNotification(t('fridges.inviteAccepted', { name: inviteSuccess }));
      }

      const [data, consumed] = await Promise.all([
        resolvedId ? fetchProducts(resolvedId) : Promise.resolve([] as Product[]),
        resolvedId ? fetchRecentlyConsumed(resolvedId) : Promise.resolve([] as Product[]),
      ]);
      setProducts(data);
      setConsumedProducts(consumed);
      setDisplayName(profile?.displayName ?? null);
      setDietaryPreferences(profile?.dietaryPreferences ?? []);
      setDislikedIngredients(profile?.dislikedIngredients ?? []);
      setCustomPreferences(profile?.customPreferences ?? '');
      setKitchenEquipment(profile?.kitchenEquipment ?? []);
      if (resolvedId && userId) {
        const activeFridge = fridgeList.find(f => f.id === resolvedId);
        if ((activeFridge?.pantryStaples ?? []).length === 0) {
          const key = `pantry-onboarding-seen-${userId}`;
          if (!localStorage.getItem(key)) {
            setShowPantryOnboarding(true);
          }
        }
      }
      checkAndNotify(data, t);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [checkAndNotify, t, showNotification]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        localStorage.removeItem('notif-permission-snoozed-until');
        setModalKey(k => k + 1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
      setActiveTab(getSavedTab());
      fetchPendingIncomingCount().then(setPendingFriendCount).catch(() => {});
    } else {
      setProducts([]);
      setFridges([]);
      setActiveFridgeId('');
      setDisplayName(undefined);
      setPendingFriendCount(0);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify({ tab: activeTab, timestamp: Date.now() }));
    }
  }, [activeTab, user]);

  useEffect(() => {
    const t = setTimeout(() => setVisitedTabs(p => new Set([...p, activeTab])), 500);
    return () => clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    if (!showPantry) return;
    const handler = (e: MouseEvent) => {
      if (pantryAreaRef.current && !pantryAreaRef.current.contains(e.target as Node)) {
        setShowPantry(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showPantry]);

  const handleActiveFridgeChange = async (fridgeId: string) => {
    setActiveFridgeId(fridgeId);
    localStorage.setItem(ACTIVE_FRIDGE_KEY, fridgeId);
    try {
      const [data, consumed] = await Promise.all([
        fetchProducts(fridgeId),
        fetchRecentlyConsumed(fridgeId),
      ]);
      setProducts(data);
      setConsumedProducts(consumed);
    } catch (err) {
      console.error('Failed to load fridge products:', err);
    }
  };

  const handleFridgesChange = async () => {
    try {
      const updated = await fetchFridges();
      setFridges(updated);
    } catch (err) {
      console.error('Failed to reload fridges:', err);
    }
  };

  const handleCreateFridge = async (name: string, emoji = '🧊'): Promise<Fridge> => {
    const sourceFridge = fridges.find(f => f.id === activeFridgeId);
    const newFridge = await createFridge(name, emoji);
    const updated = await fetchFridges();
    setFridges(updated);
    await handleActiveFridgeChange(newFridge.id);
    setNewFridgeId(newFridge.id);
    if (sourceFridge && sourceFridge.pantryStaples.length > 0) {
      setCopyPantryPrompt({ targetFridgeId: newFridge.id, name: sourceFridge.name, emoji: sourceFridge.emoji, staples: sourceFridge.pantryStaples });
    }
    return newFridge;
  };

  const doInsertProduct = async (productData: Omit<Product, 'id' | 'addedDate'>) => {
    if (!user || !activeFridgeId) return;
    const fridgeZone = getFridgeZone(productData.name, productData.category);
    const productWithMeta = {
      ...productData,
      addedDate: new Date().toISOString().split('T')[0],
      fridgeZone,
    };
    const saved = await insertProduct(productWithMeta, user.id, activeFridgeId);
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
    if (!activeFridgeId) return;
    try {
      await deleteAllProducts(activeFridgeId);
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
    if (!user || !activeFridgeId) return;
    await updateFridgePantry(activeFridgeId, staples);
    setFridges(prev => prev.map(f => f.id === activeFridgeId ? { ...f, pantryStaples: staples } : f));
    dismissPantryOnboarding(user.id);
  };

  const handlePantryChange = async (fridgeId: string, staples: string[]) => {
    await updateFridgePantry(fridgeId, staples);
    setFridges(prev => prev.map(f => f.id === fridgeId ? { ...f, pantryStaples: staples } : f));
    if (staples.length > 0) {
      if (copyPantryPrompt?.targetFridgeId === fridgeId) setCopyPantryPrompt(null);
      if (newFridgeId === fridgeId) setNewFridgeId(null);
    }
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
    if (!user || !activeFridgeId) return;
    try {
      const added: Product[] = [];
      for (const draft of drafts) {
        const fridgeZone = getFridgeZone(draft.name, draft.category);
        const saved = await insertProduct({
          ...draft,
          expirationDate: draft.expirationDate!,
          addedDate: new Date().toISOString().split('T')[0],
          fridgeZone,
        }, user.id, activeFridgeId);
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
      <div hidden={activeTab !== 'add-product'} data-tab-visited={visitedTabs.has('add-product') || undefined}>
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
      <div hidden={activeTab !== 'fridge'} data-tab-visited={visitedTabs.has('fridge') || undefined}>
        <div ref={pantryAreaRef}>
          <div className="fridge-top-row">
            <FridgeSwitcher
              fridges={fridges}
              activeFridgeId={activeFridgeId}
              onSwitch={handleActiveFridgeChange}
              onCreateFridge={handleCreateFridge}
              onOpen={() => setShowPantry(false)}
              isOtherOpen={showPantry}
            />
            <button
              className={`pantry-toggle-btn${showPantry ? ' active' : ''}`}
              onClick={() => setShowPantry(p => !p)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
                <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>
                <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
              </svg>
              {t('settings.pantryLabel')}
            </button>
          </div>
          {showPantry && activeFridgeId && (
            <PantryPanel
              fridgeId={activeFridgeId}
              staples={fridges.find(f => f.id === activeFridgeId)?.pantryStaples ?? []}
              onSave={handlePantryChange}
              onClose={() => setShowPantry(false)}
              copySource={copyPantryPrompt?.targetFridgeId === activeFridgeId ? copyPantryPrompt : undefined}
            />
          )}
        </div>
        {newFridgeId === activeFridgeId &&
         (fridges.find(f => f.id === activeFridgeId)?.pantryStaples ?? []).length === 0 && (
          <div className="copy-pantry-banner">
            <span className="copy-pantry-text">{t('settings.pantryFillReminder')}</span>
          </div>
        )}
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
      <div hidden={activeTab !== 'cook'} data-tab-visited={visitedTabs.has('cook') || undefined}>
        <div className="fridge-top-row">
          <FridgeSwitcher
            fridges={fridges}
            activeFridgeId={activeFridgeId}
            onSwitch={handleActiveFridgeChange}
            onCreateFridge={handleCreateFridge}
          />
        </div>
        <WhatToCook
          key={activeFridgeId}
          products={products}
          dietaryPreferences={dietaryPreferences}
          dislikedIngredients={dislikedIngredients}
          customPreferences={customPreferences}
          pantryStaples={fridges.find(f => f.id === activeFridgeId)?.pantryStaples ?? []}
          onConsumeProducts={(ids) => ids.forEach(id => handleConsumeProduct(id))}
          fridgeEmoji={fridges.find(f => f.id === activeFridgeId)?.emoji}
          fridgeName={fridges.find(f => f.id === activeFridgeId)?.name}
          kitchenEquipment={kitchenEquipment}
        />
      </div>
      <div hidden={activeTab !== 'seasonal'} data-tab-visited={visitedTabs.has('seasonal') || undefined}>
        <SeasonalProducts isActive={activeTab === 'seasonal'} />
      </div>
      <div hidden={activeTab !== 'sharing'} data-tab-visited={visitedTabs.has('sharing') || undefined}>
        {displayName && (
          <SharingTab
            displayName={displayName}
            fridges={fridges}
            activeFridgeId={activeFridgeId}
            currentUserId={user?.id ?? ''}
            onFridgesChange={handleFridgesChange}
            onActiveFridgeChange={handleActiveFridgeChange}
            onCreateFridge={handleCreateFridge}
            pendingFriendCount={pendingFriendCount}
          />
        )}
      </div>
      <div hidden={activeTab !== 'settings'} data-tab-visited={visitedTabs.has('settings') || undefined}>
        <UserSettings
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          onLogout={handleLogout}
          onDietaryPreferencesChange={setDietaryPreferences}
          onDislikedIngredientsChange={setDislikedIngredients}
          onCustomPreferencesChange={setCustomPreferences}
          onKitchenEquipmentChange={setKitchenEquipment}
        />
      </div>
    </>
  );

  if (authLoading) return null;

  if (!user) return <Auth darkMode={darkMode} onToggleDarkMode={() => setDarkMode(prev => !prev)} />;

  if (displayName === undefined) return null;

  if (displayName === null) return (
    <UsernameSetup
      onComplete={async (name) => {
        setDisplayName(name); // transition immediately — don't block on fridge creation
        try {
          const defaultFridge = await createFridge(`Frigo de ${name}`);
          setFridges([defaultFridge]);
          setActiveFridgeId(defaultFridge.id);
          localStorage.setItem(ACTIVE_FRIDGE_KEY, defaultFridge.id);
        } catch {
          // Fridge creation failed — loadUserData will retry on next mount
          if (user) loadUserData(user.id);
        }
      }}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(prev => !prev)}
    />
  );

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
          )}
        </div>
        <h1>Free<span>go</span></h1>
        <div className="app-header-rule" />
        <p>{t('app.subtitle')}</p>
      </header>

      <main className="app-main">
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          urgentCount={products.filter(p => isExpired(p.expirationDate) || isExpiringSoon(p.expirationDate)).length}
          pendingFriendCount={pendingFriendCount}
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

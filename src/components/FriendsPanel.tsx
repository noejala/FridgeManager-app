import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Friend, FriendRequest, UserSearchResult,
  searchUsers, fetchFriendships, sendFriendRequest,
  acceptFriendRequest, declineFriendRequest, removeFriend,
} from '../utils/friendService';
import './FriendsPanel.css';

const APP_URL = 'https://fridgemanager.vercel.app';

interface Props {
  displayName: string;
}

export function FriendsPanel({ displayName }: Props) {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allRelatedIds = new Set([...friends.map(f => f.userId), ...pending.map(p => p.userId)]);

  useEffect(() => {
    fetchFriendships()
      .then(({ friends: f, pending: p }) => { setFriends(f); setPending(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    const { friends: f, pending: p } = await fetchFriendships();
    setFriends(f);
    setPending(p);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchUsers(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await sendFriendRequest(userId);
      await reload();
      setSearchResults([]);
      setSearchQuery('');
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      await reload();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await declineFriendRequest(friendshipId);
      await reload();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await removeFriend(friendshipId);
      await reload();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async () => {
    const shareText = t('friends.inviteShareText', { url: APP_URL });
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: APP_URL });
      } catch {
        // user dismissed share sheet — ignore
      }
    } else {
      await navigator.clipboard.writeText(APP_URL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const incomingRequests = pending.filter(p => p.direction === 'incoming');
  const outgoingRequests = pending.filter(p => p.direction === 'outgoing');

  const displayLabel = (displayName: string, firstName: string | null) =>
    firstName ? `${firstName} (@${displayName})` : `@${displayName}`;

  return (
    <div className="friends-panel">

      {/* Identity card */}
      <div className="friends-identity">
        <div className="friends-identity-row">
          <span className="friends-identity-label">{t('friends.username')}</span>
          <span className="friends-identity-value">@{displayName}</span>
        </div>
      </div>

      {/* Invite a friend */}
      <div className="friends-invite-section">
        <h4 className="friends-section-title">{t('friends.inviteTitle')}</h4>
        <p className="friends-invite-hint">{t('friends.inviteHint')}</p>
        <button className="friends-invite-btn" onClick={handleInvite}>
          {linkCopied ? t('friends.inviteCopied') : t('friends.inviteAction')}
        </button>
      </div>

      {/* Search */}
      <div className="friends-search-section">
        <h4 className="friends-section-title">{t('friends.addFriend')}</h4>
        <div className="friends-search-row">
          <input
            className="friends-search-input"
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t('friends.searchPlaceholder')}
          />
        </div>

        {searchQuery.trim() && (
          <div className="friends-search-results">
            {searching && <div className="friends-spinner" />}
            {!searching && searchResults.length === 0 && (
              <p className="friends-empty-hint">{t('friends.noResults')}</p>
            )}
            {searchResults.map(r => {
              const isRelated = allRelatedIds.has(r.userId);
              return (
                <div key={r.userId} className="friends-search-result">
                  <div className="friends-result-info">
                    {r.firstName && <span className="friends-result-firstname">{r.firstName}</span>}
                    <span className="friends-result-name">@{r.displayName}</span>
                  </div>
                  <button
                    className="friends-add-btn"
                    disabled={isRelated || actionLoading === r.userId}
                    onClick={() => handleSendRequest(r.userId)}
                  >
                    {isRelated ? t('friends.alreadyAdded') : (actionLoading === r.userId ? '…' : t('friends.sendRequest'))}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="friends-section">
          <h4 className="friends-section-title">{t('friends.pendingRequests')}</h4>
          <ul className="friends-list">
            {incomingRequests.map(req => (
              <li key={req.friendshipId} className="friends-list-item">
                <span className="friends-list-name">@{req.displayName}</span>
                <span className="friends-request-badge friends-request-badge--in">{t('friends.incoming')}</span>
                <div className="friends-request-actions">
                  <button
                    className="friends-accept-btn"
                    disabled={actionLoading === req.friendshipId}
                    onClick={() => handleAccept(req.friendshipId)}
                  >{t('friends.accept')}</button>
                  <button
                    className="friends-decline-btn"
                    disabled={actionLoading === req.friendshipId}
                    onClick={() => handleDecline(req.friendshipId)}
                  >{t('friends.decline')}</button>
                </div>
              </li>
            ))}
            {outgoingRequests.map(req => (
              <li key={req.friendshipId} className="friends-list-item">
                <span className="friends-list-name">@{req.displayName}</span>
                <span className="friends-request-badge friends-request-badge--out">{t('friends.outgoing')}</span>
                <button
                  className="friends-decline-btn"
                  disabled={actionLoading === req.friendshipId}
                  onClick={() => handleDecline(req.friendshipId)}
                >{t('friends.cancel')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friends list */}
      <div className="friends-section">
        <h4 className="friends-section-title">
          {t('friends.friendsList')}
          {friends.length > 0 && <span className="friends-count">{friends.length}</span>}
        </h4>
        {loading && <div className="friends-spinner" />}
        {!loading && friends.length === 0 && (
          <p className="friends-empty-hint">{t('friends.noFriends')}</p>
        )}
        {friends.length > 0 && (
          <ul className="friends-list">
            {friends.map(f => (
              <li key={f.friendshipId} className={`friends-list-item${confirmRemove === f.friendshipId ? ' friends-list-item--confirm' : ''}`}>
                <span className="friends-list-name">{displayLabel(f.displayName, f.firstName)}</span>
                {confirmRemove === f.friendshipId ? (
                  <span className="friends-remove-confirm">
                    <span className="friends-remove-confirm-label">{t('friends.removeConfirm')}</span>
                    <button
                      className="friends-remove-confirm-yes"
                      disabled={actionLoading === f.friendshipId}
                      onClick={() => { setConfirmRemove(null); handleRemove(f.friendshipId); }}
                    >{t('friends.remove')}</button>
                    <button
                      className="friends-remove-confirm-cancel"
                      onClick={() => setConfirmRemove(null)}
                    >{t('friends.cancel')}</button>
                  </span>
                ) : (
                  <button
                    className="friends-remove-btn"
                    disabled={actionLoading === f.friendshipId}
                    onClick={() => setConfirmRemove(f.friendshipId)}
                    title={t('friends.remove')}
                  >×</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  getFriends,
  sendFriendRequest,
  acceptFriend,
  ignoreFriend,
  removeFriend,
  getMessages,
  sendMessage,
  markRead,
} from '../api';
import { UserPlusIcon, CloseIcon, SendIcon, CheckIcon } from '../components/icons';
import type { FriendsData, ChatMessage } from '../types';

interface FriendsScreenProps {
  friends: FriendsData | null;
  onRefresh: () => void;
  dmTarget: string | null;
  onClearDmTarget: () => void;
}

function FriendAvatar({ username, size = 40 }: { username: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span
        className="friend-avatar fallback"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        title={username}
      >
        {username.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="friend-avatar"
      src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`}
      alt={username}
      width={size}
      height={size}
      onError={() => setBroken(true)}
    />
  );
}

export default function FriendsScreen({
  friends,
  onRefresh,
  dmTarget,
  onClearDmTarget,
}: FriendsScreenProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [dmUser, setDmUser] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const prevTarget = useRef<string | null>(null);

  // A toast said "open DM" — jump straight into that conversation. Only
  // reacts to NEW targets (a fresh non-null value), so the clear-then-
  // re-render from onClearDmTarget can't re-close the box.
  useEffect(() => {
    if (dmTarget && dmTarget !== prevTarget.current) {
      setDmUser(dmTarget);
    }
    if (dmTarget) onClearDmTarget();
    prevTarget.current = dmTarget;
  }, [dmTarget, onClearDmTarget]);

  // Load + poll messages while a DM box is open; mark them read.
  useEffect(() => {
    if (!dmUser) {
      setMsgs([]);
      return;
    }
    let alive = true;
    const load = async () => {
      const res = await getMessages(dmUser);
      if (!alive) return;
      setMsgs(res?.messages ?? []);
      markRead(dmUser);
    };
    load();
    const id = window.setInterval(load, 3000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [dmUser]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const submitRequest = async () => {
    if (!addName.trim()) return;
    setAddBusy(true);
    setAddMsg(null);
    const res = await sendFriendRequest(addName.trim());
    setAddBusy(false);
    if (res?.ok) {
      setAddMsg({ ok: true, text: `Friend request sent to ${addName.trim()}!` });
      setAddName('');
      onRefresh();
      window.setTimeout(() => {
        setShowAdd(false);
        setAddMsg(null);
      }, 1300);
    } else {
      setAddMsg({ ok: false, text: res?.error || 'Could not send the request' });
    }
  };

  const doAccept = async (username: string) => {
    await acceptFriend(username);
    onRefresh();
  };

  const doIgnore = async (username: string) => {
    await ignoreFriend(username);
    onRefresh();
  };

  const doRemove = async (username: string) => {
    await removeFriend(username);
    if (dmUser === username) setDmUser(null);
    onRefresh();
  };

  const submitMsg = async () => {
    if (!dmUser || !msgText.trim() || sending) return;
    setSending(true);
    await sendMessage(dmUser, msgText.trim());
    setMsgText('');
    setSending(false);
    const res = await getMessages(dmUser);
    setMsgs(res?.messages ?? []);
  };

  const requests = friends?.requests ?? [];
  const friendList = friends?.friends ?? [];
  const unread = friends?.dm_unread ?? {};

  return (
    <div className="screen friends-screen">
      <div className="screen-head friends-head">
        <div>
          <h1 className="screen-title">Friends</h1>
          <p className="screen-sub">
            Manage your friends, friend requests and direct messages
          </p>
        </div>
        <button className="add-friend-btn" onClick={() => setShowAdd(true)}>
          <UserPlusIcon size={16} />
          <span>Add Friend</span>
        </button>
      </div>

      {requests.length > 0 && (
        <section className="friend-section">
          <h2 className="friend-section-title">FRIEND REQUESTS</h2>
          <div className="request-list">
            {requests.map((r) => (
              <div className="request-row" key={r.username}>
                <FriendAvatar username={r.username} size={36} />
                <div className="request-text">
                  <b>{r.username}</b>
                  <span>sends a friend request to you</span>
                </div>
                <div className="request-actions">
                  <button className="btn-primary request-accept" onClick={() => doAccept(r.username)}>
                    ACCEPT
                  </button>
                  <button className="btn-ghost request-ignore" onClick={() => doIgnore(r.username)}>
                    IGNORE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="friend-section friend-list-section">
        <h2 className="friend-section-title">FRIENDS</h2>
        {friendList.length === 0 ? (
          <div className="friends-empty">
            <p>No friends yet.</p>
            <p>Use <b>+ Add Friend</b> to send your first request.</p>
          </div>
        ) : (
          <div className="friends-list">
            {friendList.map((f) => (
              <div className="friend-row" key={f.username}>
                <button
                  className="friend-row-main"
                  onClick={() => {
                    setDmUser(f.username);
                    onRefresh();
                  }}
                  title={`Message ${f.username}`}
                >
                  <FriendAvatar username={f.username} />
                  <span className="friend-name">
                    {f.username}
                    {unread[f.username] > 0 && (
                      <span className="dm-unread">● {unread[f.username]} new</span>
                    )}
                  </span>
                  <span className="friend-open-dm">Message</span>
                </button>
                <button
                  className="friend-remove"
                  title={`Remove ${f.username}`}
                  onClick={() => doRemove(f.username)}
                >
                  <CloseIcon size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAdd && (
        <div className="overlay" onClick={() => !addBusy && setShowAdd(false)}>
          <div className="friend-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdd(false)} title="Close">
              <CloseIcon size={16} />
            </button>
            <h3 className="friend-modal-title">Add Friend</h3>
            <label className="friend-modal-label">Friend's Username</label>
            <input
              className="input friend-modal-input"
              placeholder="Username"
              value={addName}
              autoFocus
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRequest()}
            />
            {addMsg && (
              <p className={`friend-modal-msg ${addMsg.ok ? 'ok' : 'err'}`}>
                {addMsg.ok && <CheckIcon size={13} />} {addMsg.text}
              </p>
            )}
            <button
              className="add-friend-btn send-request-btn"
              onClick={submitRequest}
              disabled={addBusy || !addName.trim()}
            >
              <UserPlusIcon size={15} />
              <span>{addBusy ? 'Sending…' : 'SEND A REQUEST'}</span>
            </button>
          </div>
        </div>
      )}

      {dmUser && (
        <div className="overlay" onClick={() => setDmUser(null)}>
          <div className="dm-card" onClick={(e) => e.stopPropagation()}>
            <div className="dm-head">
              <FriendAvatar username={dmUser} size={34} />
              <span className="dm-name">{dmUser}</span>
              <button className="modal-close" onClick={() => setDmUser(null)} title="Close">
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="dm-msgs" ref={msgsRef}>
              {msgs.length === 0 ? (
                <p className="dm-empty">No messages yet — say hi!</p>
              ) : (
                msgs.map((m, i) => (
                  <div className={`dm-msg ${m.from === (friends?.me ?? '') ? 'mine' : ''}`} key={i}>
                    <FriendAvatar username={m.from} size={26} />
                    <span className="dm-msg-body">
                      <span className="dm-msg-from">{m.from}</span>
                      <span className="dm-msg-arrow">&gt;</span>
                      <span className="dm-msg-text">{m.text}</span>
                      <span className="dm-msg-time">
                        {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="dm-input-row">
              <input
                className="input dm-input"
                placeholder={`Message ${dmUser}…`}
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitMsg()}
              />
              <button className="btn-primary dm-send" onClick={submitMsg} disabled={!msgText.trim()}>
                <SendIcon size={15} />
                <span>SEND</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

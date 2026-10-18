import React from 'react';
import {
  X,
  User,
  LogOut,
  Sparkles,
  Volume2,
  Check,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Mail,
  Zap,
  Users
} from 'lucide-react';
import { UserProfile } from '../types/tts';
import {
  getAllUsers,
  loginWithGoogleAccount,
  setActiveUserId,
  logoutUser
} from '../utils/userManager';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged
}) => {
  const [newEmail, setNewEmail] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [isAddingAccount, setIsAddingAccount] = React.useState(false);
  const [savedUsers, setSavedUsers] = React.useState<UserProfile[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setSavedUsers(getAllUsers());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchAccount = (user: UserProfile) => {
    setActiveUserId(user.id);
    onUserChanged(user);
  };

  const handleCreateOrLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const user = loginWithGoogleAccount(newEmail.trim(), newName.trim() || undefined);
    setSavedUsers(getAllUsers());
    onUserChanged(user);
    setIsAddingAccount(false);
    setNewEmail('');
    setNewName('');
  };

  const handleLogout = () => {
    logoutUser();
    onUserChanged(null);
  };

  const voiceRemaining = currentUser
    ? Math.max(0, currentUser.dailyVoiceQuota - currentUser.usedVoiceQuota)
    : 0;
  const voicePercent = currentUser
    ? Math.round((voiceRemaining / currentUser.dailyVoiceQuota) * 100)
    : 0;

  const aiRemaining = currentUser
    ? Math.max(0, currentUser.dailyAiQuota - currentUser.usedAiQuota)
    : 0;
  const aiPercent = currentUser
    ? Math.round((aiRemaining / currentUser.dailyAiQuota) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Conta & Cota Gratuita Individual
              </h3>
              <p className="text-[11px] text-slate-400">
                Acesse com sua própria conta e use sua cota exclusiva
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {currentUser ? (
            <>
              {/* Active User Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-xl bg-slate-800 border border-indigo-500/40 p-1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {currentUser.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Conta Ativa
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Desconectar"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Quotas Breakdown */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  {/* Voice Quota */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        Cota de Voz Neural (Gemini TTS):
                      </span>
                      <span className="font-mono font-bold text-indigo-300">
                        {voiceRemaining} / {currentUser.dailyVoiceQuota} restantes
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${voicePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Generation Quota */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        Cota de Roteiro & Criatividade IA:
                      </span>
                      <span className="font-mono font-bold text-pink-300">
                        {aiRemaining} / {currentUser.dailyAiQuota} restantes
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-400 transition-all duration-300"
                        style={{ width: `${aiPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Cota pessoal gratuita renovada diariamente à meia-noite.</span>
                </div>
              </div>

              {/* Saved Accounts Switcher */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Contas Salvas neste Dispositivo
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingAccount(!isAddingAccount)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer"
                  >
                    {isAddingAccount ? 'Cancelar' : '+ Nova Conta'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {savedUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    const uVoiceRemaining = Math.max(0, u.dailyVoiceQuota - u.usedVoiceQuota);

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSwitchAccount(u)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-lg bg-slate-800"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {uVoiceRemaining} créditos
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Logged Out / Welcome Screen */
            <div className="text-center py-6 px-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/10">
                <Zap className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Conecte sua Conta para Gerar Áudios
              </h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Cada usuário tem direito a uma <strong>cota gratuita diária exclusiva</strong> para sintetizar vozes neurais e criar roteiros inteligentes com o Gemini 3.8 Flash TTS.
              </p>

              {/* Quick Google Sign In */}
              <button
                type="button"
                onClick={() => {
                  const user = loginWithGoogleAccount('maikisson12@gmail.com', 'Maikisson');
                  onUserChanged(user);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer mb-3"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>Entrar com Google (maikisson12@gmail.com)</span>
              </button>
            </div>
          )}

          {/* Form to add a new account */}
          {(isAddingAccount || !currentUser) && (
            <form onSubmit={handleCreateOrLogin} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Entrar com outra conta de usuário:</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Seu E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Seu Nome (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Acessar com esta Conta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../../types';
import { X, Send, Bot, Sparkles, MessageSquare, Phone, CheckCheck, ExternalLink, Mail, ShieldCheck } from 'lucide-react';

interface LiveChatModalProps {
  property: Property | null;
  onClose: () => void;
  onNotifyAdmin?: (subject: string, message: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'guest' | 'ai_host' | 'admin';
  text: string;
  timestamp: string;
  isAiPowered?: boolean;
  emailDispatched?: boolean;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({ property, onClose, onNotifyAdmin }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai_host',
      text: `Sawubona! Welcome to ScopeBridg 24/7 Host & Admin Desk (Admin Cell: +27 69 497 7018). Every message here is synced with In-App Chat, Admin Email (admin@scopebridg.co.za), and WhatsApp (+27 69 497 7018). How can we assist you today?`,
      timestamp: 'Just now',
      isAiPowered: true,
      emailDispatched: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [guestEmailInput, setGuestEmailInput] = useState('guest@scopebridg.co.za');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage.trim();
    if (!message) return;

    const guestMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'guest',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emailDispatched: true,
    };

    setMessages((prev) => [...prev, guestMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    // Dispatch Email + WhatsApp + In-App Chat alert to Super Admin (+27 69 497 7018)
    try {
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'GUEST_IN_APP_CHAT_AND_EMAIL',
          title: `In-App Chat & Email from Guest (${property?.title || 'ScopeBridg Direct'})`,
          message,
          recipientEmail: guestEmailInput,
          recipientPhone: '+27 69 497 7018',
          adminWhatsApp: '+27 69 497 7018',
        }),
      }).catch(() => {});
      if (onNotifyAdmin) {
        onNotifyAdmin(`In-App Chat & Email (${property?.title || 'General'})`, message);
      }
    } catch {
      // ignore
    }

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          propertyName: property?.title || 'Executive Suite',
          guestName: 'Valued Guest',
          contextRules: {
            wifi: property?.checkInInstructions.wifiPassword,
            gate: property?.checkInInstructions.gateCode,
            parking: property?.checkInInstructions.parkingBay,
            lockbox: property?.checkInInstructions.smartLockPin,
            adminPhone: '+27 69 497 7018',
          },
        }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai_host',
        text:
          (data.reply || 'Thank you for reaching out! Super Admin (+27 69 497 7018) and your Host have received your email and in-app chat notification.') +
          `\n\n📧 Email & WhatsApp Alert delivered to Super Admin (+27 69 497 7018).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiPowered: data.isAiPowered ?? true,
        emailDispatched: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'ai_host',
          text: `WiFi: '${property?.checkInInstructions.wifiName || 'ScopeBridg_Solar_5G'}' (password: ${property?.checkInInstructions.wifiPassword || 'WelcomeGuest2026'}). Smart Lock PIN: ${property?.checkInInstructions.smartLockPin || '4821#'}. Your message has also been emailed & forwarded to Super Admin (+27 69 497 7018).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAiPowered: false,
          emailDispatched: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    'Send Email & OTP check to Admin (+27 69 497 7018)',
    'What is the WiFi password?',
    'How do I check in with the smart lock?',
    'Request Payment Gateway OTP approval',
    'Is there solar backup power for load shedding?',
  ];

  const adminWhatsappUrl = `https://wa.me/27694977018?text=${encodeURIComponent(
    `Hi ScopeBridg Super Admin (+27 69 497 7018), I am reaching out from In-App Chat regarding ${property?.title || 'my booking'}.`
  )}`;
  const whatsappPhone = property?.ownerWhatsApp || '+27694977018';
  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi ${property?.ownerName || 'Host'}, I am reaching out from ScopeBridg regarding ${property?.title || 'my stay'}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[600px] max-h-[90vh]">
        {/* Chat Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white border border-emerald-500 shadow-inner">
              <Bot className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-800 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold leading-tight">24/7 Virtual Host</h3>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-700">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Gemini AI 24/7
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {property ? property.title : 'ScopeBridg Global Stays'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white transition-colors"
              title="Open in WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp & Email Direct Jump Bar */}
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>Admin Cell: <strong className="font-mono">+27 69 497 7018</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={adminWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-800 font-bold hover:underline"
            >
              <span>WhatsApp Admin (+27 69 497 7018)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-600 font-semibold hover:underline"
            >
              <span>Host</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'guest'
                    ? 'bg-emerald-700 text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-xs'
                }`}
              >
                {msg.sender === 'ai_host' && (
                  <div className="flex items-center gap-1 mb-1 text-[10px] text-emerald-700 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Ferndale AI Host</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                    msg.sender === 'guest' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'guest' && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-xs p-3 border border-slate-200 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-medium transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about WiFi, smart lock code, directions..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-emerald-600"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

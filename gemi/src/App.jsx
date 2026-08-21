import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Video, Mic, FileText, Bot, User, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState(null); // { type: 'image_url' | 'video_url' | 'audio_url', url: 'data:...' }
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let type = "image_url";
      if (file.type.startsWith("video/")) type = "video_url";
      if (file.type.startsWith("audio/")) type = "audio_url";
      
      setAttachedMedia({ type, url: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => setAttachedMedia(null);

  const sendMessage = async () => {
    if (!input.trim() && !attachedMedia) return;

    // 1. Construct user message payload
    let userContent = [];
    if (input.trim()) {
      userContent.push({ type: "text", text: input });
    }
    if (attachedMedia) {
      userContent.push({
        type: attachedMedia.type,
        [attachedMedia.type]: { url: attachedMedia.url }
      });
    }

    const newUserMsg = { role: "user", content: userContent };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setAttachedMedia(null);
    setIsTyping(true);

    try {
      // 2. We use fetch to stream Server-Sent Events from Krypton Gateway
      const response = await fetch("http://127.0.0.1:8000/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-3.5-flash",
          messages: [...messages, newUserMsg],
          max_tokens: 2000,
          stream: true,
          user_id: "gemi_client_01"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Gateway returned ${response.status}`);
      }

      // Add a placeholder assistant message that we will append to
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      let buffer = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line in buffer

          for (let line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices[0]?.delta?.content || "";
                if (delta) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const last = { ...newMsgs[newMsgs.length - 1] };
                    last.content += delta;
                    newMsgs[newMsgs.length - 1] = last;
                    return newMsgs;
                  });
                }
              } catch (e) {
                // partial JSON or parse error, ignore
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `**[SYSTEM ERROR]** ${error.message}`,
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-amoled-black font-sans text-gray-100 selection:bg-cyber-green/30">
      
      {/* Header */}
      <header className="glass-panel py-4 px-6 sticky top-0 z-10 flex items-center gap-3 border-b-0 border-white/5">
        <div className="w-8 h-8 rounded bg-cyber-green/20 border border-cyber-green/40 flex items-center justify-center">
          <Bot size={20} className="text-cyber-green" />
        </div>
        <h1 className="text-xl font-display font-bold tracking-wider">GEMI <span className="text-gray-500 font-mono text-xs">powered by Krypton</span></h1>
      </header>

      {/* Chat Stream */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
            <Bot size={64} className="mb-4 text-cyber-green" />
            <h2 className="text-2xl font-display mb-2">Hello, I'm Gemi.</h2>
            <p className="font-mono text-sm max-w-md">I am connected to the Krypton Active-Defense Gateway. Ask me anything or upload an image to test the multimodal proxy!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-4xl w-full mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-amoled-light border-white/10' : 'bg-cyber-green/10 border-cyber-green/30'}`}>
              {msg.role === 'user' ? <User size={16} className="text-gray-400" /> : <Bot size={16} className="text-cyber-green" />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-2xl flex-1 ${msg.role === 'user' ? 'glass-chat-bubble-user rounded-tr-sm' : 'glass-chat-bubble-ai rounded-tl-sm'} ${msg.isError ? 'border-threat-red/50 bg-threat-red/10' : ''}`}>
              {/* Render Media if user attached any */}
              {Array.isArray(msg.content) && msg.content.map((part, pIdx) => {
                if (part.type === 'text') return <p key={pIdx} className="mb-2 whitespace-pre-wrap">{part.text}</p>;
                if (part.type === 'image_url') return <img key={pIdx} src={part.image_url.url} className="max-w-xs md:max-w-md rounded-lg mb-2 border border-white/10" alt="uploaded" />;
                if (part.type === 'video_url') return <div key={pIdx} className="mb-2 p-3 bg-amoled-card border border-white/10 rounded flex items-center gap-3 font-mono text-sm"><Video size={16} className="text-yellow-400" /> [Attached Video File]</div>;
                if (part.type === 'audio_url') return <div key={pIdx} className="mb-2 p-3 bg-amoled-card border border-white/10 rounded flex items-center gap-3 font-mono text-sm"><Mic size={16} className="text-pink-400" /> [Attached Audio File]</div>;
                return null;
              })}

              {/* Render AI Text with Markdown */}
              {typeof msg.content === 'string' && (
                <div className="prose prose-invert prose-green max-w-none prose-pre:bg-amoled-card prose-pre:border prose-pre:border-white/10 prose-code:font-mono">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-4 max-w-4xl w-full mx-auto">
             <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-cyber-green/10 border border-cyber-green/30">
               <Bot size={16} className="text-cyber-green" />
             </div>
             <div className="p-4 rounded-2xl glass-chat-bubble-ai rounded-tl-sm flex items-center gap-1">
               <span className="w-2 h-2 bg-cyber-green/50 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-cyber-green/50 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
               <span className="w-2 h-2 bg-cyber-green/50 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Attachment Preview */}
        {attachedMedia && (
          <div className="mb-4 inline-flex items-center gap-3 bg-amoled-card border border-white/10 py-2 px-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            {attachedMedia.type === 'image_url' ? <ImageIcon size={16} className="text-blue-400" /> : attachedMedia.type === 'video_url' ? <Video size={16} className="text-yellow-400" /> : <Mic size={16} className="text-pink-400" />}
            <span className="font-mono text-xs text-gray-300">Attached Media</span>
            <button onClick={removeMedia} className="text-gray-500 hover:text-threat-red transition-colors p-1"><Trash2 size={14}/></button>
          </div>
        )}

        <div className="glass-panel p-2 rounded-2xl flex items-end gap-2 focus-within:border-cyber-green/50 transition-colors">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*,audio/*"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0 mb-1"
          >
            <FileText size={20} />
          </button>
          
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Gemi..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-2 max-h-32 text-gray-100 placeholder:text-gray-600"
            rows="1"
          />

          <button 
            onClick={sendMessage}
            disabled={(!input.trim() && !attachedMedia) || isTyping}
            className="p-3 bg-cyber-green text-amoled-black hover:bg-emerald-400 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 rounded-xl transition-colors shrink-0 mb-1 font-bold"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center font-mono text-[10px] text-gray-600 mt-3">Gemi connects directly to the local Krypton Active-Defense Gateway (Port 8000).</p>
      </footer>
    </div>
  );
}

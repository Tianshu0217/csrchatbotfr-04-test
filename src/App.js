// src/App.js
import React, { useState, useEffect, useRef } from 'react';

/** 简单 URL 正则，用于链接识别 */
const urlRegex = /(https?:\/\/[^\s]+)/g;

/**
 * 按空行（两个及以上连续换行）拆段，返回非空段落数组
 * @param {string} text
 * @returns {string[]}
 */
function splitReply(text) {
  return text
    .split(/\n{2,}/g)
    .map(p => p.trim())
    .filter(p => p);
}

/**
 * 渲染时将文本中的 URL 转成可点击的 <a> 标签
 * @param {string} text 
 * @returns {Array<string|JSX.Element>}
 */
function renderWithLinks(text) {
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
      : part
  );
}

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 每次 chat 更新后滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim()) return;
  
    // 1. 构造用户消息并更新前端聊天状态
    const userMessage = { role: "user", content: input };
    const newChat = [...chat, userMessage];
    setChat(newChat);
    setInput("");
    setLoading(true);
  
    try {
      // 2. 发送请求到后端，只包含历史对话
      const API = process.env.REACT_APP_API_URL;

      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ messages: newChat })
      });
      console.log(">> HTTP", res.status, res.statusText);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
  
      // 3. 解析后端返回
      const data = await res.json();
      console.log("🔢 backend replied, data.reply:", data.reply);
  
      // 4. 拆分长回复
      const segments = splitReply(data.reply);
  
      // 5. 按序定时插入每条 assistant 消息
      segments.forEach((seg, idx) => {
        setTimeout(() => {
          setChat(prev => [
            ...prev,
            { role: "assistant", content: seg }
          ]);
          // 最后一条插入后关闭 loading
          if (idx === segments.length - 1) {
            setLoading(false);
          }
        }, idx * 3000); // 第 0 条 0ms, 第1条 3000ms, 第2条 6000ms...
      });
    } catch (err) {
      console.error("Chat API error:", err);
      setChat(prev => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong, please try again later." }
      ]);
      setLoading(false);
    }
  };
  
  

  // 回车发送逻辑
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💬 CSR ChatBot</h2>
      <div style={styles.chatBox}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
              marginBottom: 10
            }}
          >
            <img
              src={
                msg.role === "user"
                  ? "https://cdn-icons-png.flaticon.com/512/1946/1946429.png"
                  : "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
              }
              alt="avatar"
              style={styles.avatar}
            />
            <div
              style={{
                ...styles.message,
                backgroundColor: msg.role === "user" ? "#dcf8c6" : "#f1f0f0",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              {renderWithLinks(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontStyle: "italic", marginBottom: 10 }}>
            🤖 Response in progress...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <textarea
          style={styles.input}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message and press Enter to send it..."
        />
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    height: "100vh"
  },
  title: {
    textAlign: "center",
    marginBottom: 10
  },
  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 10,
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: 8,
    background: "#fff",
    marginBottom: 10
  },
  message: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 10,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap"
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    margin: "0 10px"
  },
  inputContainer: {
    display: "flex",
    gap: 10
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
    fontSize: 16,
    resize: "none"
  },
  button: {
    padding: "0 20px",
    fontSize: 16,
    borderRadius: 5,
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer"
  }
};

export default App;

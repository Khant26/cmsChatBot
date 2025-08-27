import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './index.css';

// System prompt with restrictions and keywords
const systemPrompt = `
You are a helpful chatbot strictly for CMS (Civil Master Solution). 
Only respond to questions related to the company, its mission, products (Armour Joints, Steel Fibers, Micro Fibers, Synthetic Fibers), 
services, engineering support, standards, projects, hours, training, brochures, contact details, or warranties.  

key CMS-related keywords include: products, services, support, design, engineering, standards, contact, pricing, features, company info, history, founders, mission, values, FAQ, 
phone number, hotline, brochures, training, Line account.  
  

If the query seems related to CMS (including questions about the company’s founders, history, mission, values, products, services, or support), provide concise, friendly, and professional responses.  
If the query is clearly off-topic and unrelated to CMS, politely refuse. 
If the query is off-topic, unrelated to CMS, or does not match these keywords, politely refuse to answer and say:  
"I'm sorry, I can only assist with CMS-related questions. Please ask about our products, services, or support."  

If you don't know the answer to a CMS-related question, suggest contacting support at support@cms.com or calling our hotline.  
Do not use Markdown formatting like bold or asterisks in your responses.
`;

const initialHistory = [
  // Greeting
  { role: 'user', parts: [{ text: 'Hello' }] },
  { role: 'model', parts: [{ text: 'Great to meet you. What would you like to know about CMS?' }] },

  // Company & Mission
  { role: 'user', parts: [{ text: 'Who founded CMS and why?' }] },
  { role: 'model', parts: [{ text: 'CMS was founded by Thai engineers with a vision for smarter flooring solutions.' }] },

  { role: 'user', parts: [{ text: 'What is CMS’s main mission?' }] },
  { role: 'model', parts: [{ text: 'Our mission is to build a smarter future for floors with quality and innovation.' }] },

  { role: 'user', parts: [{ text: 'What makes CMS unique?' }] },
  { role: 'model', parts: [{ text: 'We focus on custom fiber solutions and proven expertise in flooring systems.' }] },

  { role: 'user', parts: [{ text: 'Why does CMS lead in Thailand?' }] },
  { role: 'model', parts: [{ text: 'Because of our proven local success and trusted reputation.' }] },

  { role: 'user', parts: [{ text: 'What values guide CMS work?' }] },
  { role: 'model', parts: [{ text: 'Quality, trust, and safety are at the heart of everything we do.' }] },

  { role: 'user', parts: [{ text: 'What does CMS stand for?' }] },
  { role: 'model', parts: [{ text: 'CMS stands for Civil Master Solution.' }] },

  { role: 'user', parts: [{ text: 'How does CMS define service?' }] },
  { role: 'model', parts: [{ text: 'We see service as support that goes far beyond sales.' }] },

  { role: 'user', parts: [{ text: 'What career growth does CMS offer?' }] },
  { role: 'model', parts: [{ text: 'We provide training and clear promotion paths for growth.' }] },

  // Services & Support
  { role: 'user', parts: [{ text: 'How does CMS help clients?' }] },
  { role: 'model', parts: [{ text: 'We offer expert on-site support and consultancy.' }] },

  { role: 'user', parts: [{ text: 'What consultancy is free?' }] },
  { role: 'model', parts: [{ text: 'We provide free design checks and cost reviews.' }] },

  { role: 'user', parts: [{ text: 'How to request analysis?' }] },
  { role: 'model', parts: [{ text: 'You can email your project files for analysis.' }] },

  { role: 'user', parts: [{ text: 'Which standards are used?' }] },
  { role: 'model', parts: [{ text: 'We follow ASTM, Eurocode, and ACI standards.' }] },

  { role: 'user', parts: [{ text: 'What are the steps in CMS support?' }] },
  { role: 'model', parts: [{ text: 'We review, design, and assist clients throughout their project.' }] },

  { role: 'user', parts: [{ text: 'How do drawings save time?' }] },
  { role: 'model', parts: [{ text: 'Our clear layouts speed up execution and reduce errors.' }] },

  { role: 'user', parts: [{ text: 'What’s in a design package?' }] },
  { role: 'model', parts: [{ text: 'It includes drawings, reports, and a bill of quantities (BOQ).' }] },

  { role: 'user', parts: [{ text: 'How fast is CMS reply?' }] },
  { role: 'model', parts: [{ text: 'We respond within 24 hours.' }] },

  // Products
  { role: 'user', parts: [{ text: 'What is Armour Joint?' }] },
  { role: 'model', parts: [{ text: 'It is a floor edge guard that protects slabs.' }] },

  { role: 'user', parts: [{ text: 'Why use Armour Joints?' }] },
  { role: 'model', parts: [{ text: 'They extend slab life by preventing edge damage.' }] },

  { role: 'user', parts: [{ text: 'What is steel fiber for?' }] },
  { role: 'model', parts: [{ text: 'Steel fibers provide crack control and added strength.' }] },

  { role: 'user', parts: [{ text: 'Why micro steel fiber?' }] },
  { role: 'model', parts: [{ text: 'They deliver higher tensile strength for advanced mixes.' }] },

  { role: 'user', parts: [{ text: 'Steel vs micro fiber?' }] },
  { role: 'model', parts: [{ text: 'They differ in size, strength, and application.' }] },

  { role: 'user', parts: [{ text: 'What is synthetic fiber?' }] },
  { role: 'model', parts: [{ text: 'It is a polymer-based material that shields against cracks.' }] },

  { role: 'user', parts: [{ text: 'Can fibres and joints work together?' }] },
  { role: 'model', parts: [{ text: 'Yes, they deliver the best performance when combined.' }] },

  { role: 'user', parts: [{ text: 'What’s CMS’s product warranty?' }] },
  { role: 'model', parts: [{ text: 'Our products come with warranties of up to five years.' }] },

  { role: 'user', parts: [{ text: 'Why choose fibers?' }] },
  { role: 'model', parts: [{ text: 'Fibers help reduce shrinkage cracks and improve durability.' }] },

  { role: 'user', parts: [{ text: 'How do fibers cut costs?' }] },
  { role: 'model', parts: [{ text: 'They reduce the need for rebar, lowering material and labor costs.' }] },

  { role: 'user', parts: [{ text: 'Can fibers replace mesh?' }] },
  { role: 'model', parts: [{ text: 'Yes, fibers can replace mesh in many slab applications.' }] },

  { role: 'user', parts: [{ text: 'Why are CMS fibers unique?' }] },
  { role: 'model', parts: [{ text: 'They are tested to ensure high performance and quality.' }] },

  { role: 'user', parts: [{ text: 'Where are Armour Joints used?' }] },
  { role: 'model', parts: [{ text: 'They are commonly used in warehouses and plants.' }] },

  { role: 'user', parts: [{ text: 'How long do joints last?' }] },
  { role: 'model', parts: [{ text: 'With proper care, joints can last for decades.' }] },

  // Technical & Engineering
  { role: 'user', parts: [{ text: 'How to optimize fiber design?' }] },
  { role: 'model', parts: [{ text: 'We use advanced modeling to optimize fiber dosage.' }] },

  { role: 'user', parts: [{ text: 'Why joint detailing?' }] },
  { role: 'model', parts: [{ text: 'It ensures strong load transfer and durability.' }] },

  { role: 'user', parts: [{ text: 'Which codes are followed?' }] },
  { role: 'model', parts: [{ text: 'We follow ASTM, ACI, and Eurocode standards.' }] },

  { role: 'user', parts: [{ text: 'How does CMS check safety?' }] },
  { role: 'model', parts: [{ text: 'Through testing, reviews, and quality checks.' }] },

  { role: 'user', parts: [{ text: 'What tools are used for cost?' }] },
  { role: 'model', parts: [{ text: 'We use in-house developed cost estimation software.' }] },

  { role: 'user', parts: [{ text: 'How do you balance cost and quality?' }] },
  { role: 'model', parts: [{ text: 'By optimizing fiber dosage to achieve both strength and economy.' }] },

  { role: 'user', parts: [{ text: 'Why offer free consultancy?' }] },
  { role: 'model', parts: [{ text: 'Because we want to build long-term trust with clients.' }] },

  { role: 'user', parts: [{ text: 'Who designs at CMS?' }] },
  { role: 'model', parts: [{ text: 'Our licensed engineers handle all design work.' }] },

  { role: 'user', parts: [{ text: 'Why is steel fiber better than rebar?' }] },
  { role: 'model', parts: [{ text: 'It delivers faster, cheaper, and more durable slabs.' }] },

  { role: 'user', parts: [{ text: 'Why micro fiber UHPFRC?' }] },
  { role: 'model', parts: [{ text: 'It creates ultra-high strength concrete for advanced projects.' }] },

  // Client Engagement
  { role: 'user', parts: [{ text: 'What is the most common FAQ asked?' }] },
  { role: 'model', parts: [{ text: 'Clients often ask about the differences between fibers and rebar.' }] },

  { role: 'user', parts: [{ text: 'Why are sample requests important?' }] },
  { role: 'model', parts: [{ text: 'Samples allow clients to test products in real applications.' }] },

  { role: 'user', parts: [{ text: 'How can I get brochures?' }] },
  { role: 'model', parts: [{ text: 'You can request brochures by email or at our office.' }] },

  { role: 'user', parts: [{ text: 'What training does CMS offer?' }] },
  { role: 'model', parts: [{ text: 'We offer training and guidance on proper fiber use.' }] },

  { role: 'user', parts: [{ text: 'How to contact CMS fast?' }] },
  { role: 'model', parts: [{ text: 'You can call our hotline for direct support.' }] },

  { role: 'user', parts: [{ text: 'What is the typical response time?' }] },
  { role: 'model', parts: [{ text: 'We typically respond the same working day.' }] },

  { role: 'user', parts: [{ text: 'Does CMS do site visits?' }] },
  { role: 'model', parts: [{ text: 'Yes, we provide site visits upon request.' }] },

  { role: 'user', parts: [{ text: 'How does CMS tailor design?' }] },
  { role: 'model', parts: [{ text: 'We customize designs based on traffic and load conditions.' }] },

  // Projects & Applications
  { role: 'user', parts: [{ text: 'Who uses Armour Joints?' }] },
  { role: 'model', parts: [{ text: 'They are widely used by industrial warehouses.' }] },

  { role: 'user', parts: [{ text: 'Who uses CMS fibers?' }] },
  { role: 'model', parts: [{ text: 'Our fibers are used in roads, slabs, and industrial plants.' }] },

]



const App = () => {
  // Only show the first two messages in the UI, rest are for model context only
  const [messages, setMessages] = useState(
    initialHistory.slice(0, 2).map((msg) => ({
      sender: msg.role === 'user' ? 'user' : 'bot',
      text: msg.parts[0].text,
    }))
  );
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatSessionRef = useRef(null);

  // Initialize Gemini API and chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        chatSessionRef.current = await model.startChat({
          history: initialHistory,
          generationConfig: { maxOutputTokens: 100 },
        });
      } catch (error) {
        console.error('Failed to initialize Gemini API:', error);
      }
    };
    initChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !chatSessionRef.current) return;

    const newMessages = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    scrollToBottom();
    focusInput();

    try {
      // Prepend system prompt to enforce company focus
      const fullMessage = `${systemPrompt}\nUser: ${userInput}`;
      const result = await chatSessionRef.current.sendMessage(fullMessage);
      let reply = result.response.text();
      // Remove any asterisks or Markdown formatting
      reply = reply.replace(/[*_]+/g, '');
      setMessages([...newMessages, { sender: 'bot', text: reply }]);
      scrollToBottom();
      focusInput();
    } catch (error) {
      setMessages([...newMessages, { sender: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
      scrollToBottom();
      focusInput();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4 flex flex-col">
        <div className="bg-blue-600 text-white p-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Company Chatbot</h2>
        </div>
        <div className="h-[400px] overflow-y-scroll p-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-gray-800">
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="flex p-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            ref={inputRef}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
/**
 * Demo Data Generator for ChatMapSidebar
 * 
 * This utility helps populate the ChatMapSidebar with sample data for testing.
 * 
 * Usage in Browser Console:
 * 
 * 1. Copy this entire file content
 * 2. Paste into browser console
 * 3. Call: generateSampleChats(10)
 * 4. Refresh the page to see the chats in the sidebar
 */

interface ChatMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  thumb?: string;
  snippet: string;
}

const sampleTitles = [
  "How to learn React",
  "JavaScript best practices",
  "Python data analysis",
  "Machine learning basics",
  "Web development tips",
  "Database design patterns",
  "API security guidelines",
  "Performance optimization",
  "Code review checklist",
  "Testing strategies",
  "Docker deployment",
  "Git workflow tips",
  "TypeScript migration",
  "CSS Grid layout",
  "Async programming",
];

const sampleSnippets = [
  "I'm trying to understand React hooks and how to use them effectively in my projects. Can you explain useState and useEffect?",
  "What are the best practices for writing clean and maintainable JavaScript code in large applications?",
  "I need help analyzing a dataset with pandas. How do I handle missing values and outliers?",
  "Can you explain the basics of supervised learning and how neural networks work?",
  "What are the essential tools and frameworks I should know for modern web development?",
  "I'm designing a database for an e-commerce application. What are the key tables and relationships?",
  "How can I secure my REST API against common vulnerabilities like SQL injection and XSS?",
  "My application is running slow. What are some techniques to improve frontend performance?",
  "I'm setting up code reviews for my team. What should we look for in a good code review?",
  "What testing strategies should I use for a React application? Unit tests vs integration tests?",
  "I want to deploy my application using Docker. Can you guide me through creating a Dockerfile?",
  "What's the best Git workflow for a team of 5 developers working on the same codebase?",
  "We're migrating our JavaScript codebase to TypeScript. What's the best approach?",
  "I'm having trouble with CSS Grid. How do I create a responsive layout with it?",
  "Can you explain promises, async/await, and how to handle errors in asynchronous code?",
];

function generateSampleChats(count: number = 10): void {
  const chats: ChatMeta[] = [];
  const now = Date.now();
  
  for (let i = 0; i < Math.min(count, 15); i++) {
    const daysAgo = Math.floor(Math.random() * 30); // Random date within last 30 days
    const createdAt = now - (daysAgo * 24 * 60 * 60 * 1000);
    
    chats.push({
      id: `chat-${createdAt}-${Math.random().toString(36).substr(2, 9)}`,
      title: sampleTitles[i],
      createdAt,
      updatedAt: createdAt + Math.floor(Math.random() * 1000000),
      snippet: sampleSnippets[i],
    });
  }
  
  // Store in localStorage
  localStorage.setItem('nextchat-map', JSON.stringify(chats));
  
  // Emit update event
  const event = new CustomEvent('chatstore:update', { detail: chats });
  window.dispatchEvent(event);
  
  console.log(`Generated ${chats.length} sample chats`);
  console.log('Refresh the page to see them in the ChatMapSidebar');
}

function clearAllChats(): void {
  localStorage.removeItem('nextchat-map');
  const event = new CustomEvent('chatstore:update', { detail: [] });
  window.dispatchEvent(event);
  console.log('All chats cleared');
  console.log('Refresh the page to see the empty state');
}

// Export functions to window for easy access
if (typeof window !== 'undefined') {
  (window as any).generateSampleChats = generateSampleChats;
  (window as any).clearAllChats = clearAllChats;
  
  console.log('ChatMap Demo Utilities loaded!');
  console.log('Available commands:');
  console.log('  - generateSampleChats(10)  // Generate sample chat data');
  console.log('  - clearAllChats()          // Clear all chat data');
}

export { generateSampleChats, clearAllChats };

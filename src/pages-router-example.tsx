// Pages Router 示例 (如果使用Pages Router)
import { useState, useEffect } from 'react';

// 数据获取函数
async function getData() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
  return res.json() as Promise<{ title: string; body: string; id: number }>;
}

// 页面组件
export default function PagesRouterExample() {
  const [data, setData] = useState<{ title: string; body: string; id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getData();
        setData(result);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pages Router 特性展示</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-bold">数据获取</h2>
          <p className="text-sm text-gray-600">使用useEffect获取数据</p>
          <div className="mt-2">
            <strong>标题:</strong> {data?.title}
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-lg font-bold">客户端组件</h2>
          <p className="text-sm text-gray-600">支持交互状态</p>
          <div className="mt-2">
            <button 
              onClick={() => setCount(count + 1)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              计数: {count}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Pages Router 特点:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ 成熟稳定</li>
          <li>✅ 学习曲线平缓</li>
          <li>✅ 丰富的社区资源</li>
          <li>✅ 更好的第三方库兼容性</li>
          <li>❌ 需要手动处理加载状态</li>
          <li>❌ 客户端包大小较大</li>
        </ul>
      </div>
    </div>
  );
}

// 如果使用getServerSideProps (Pages Router)
export async function getServerSideProps() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const data = await res.json();
    
    return {
      props: {
        initialData: data,
      },
    };
  } catch (error) {
    return {
      props: {
        initialData: null,
      },
    };
  }
} 
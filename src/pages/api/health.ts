export const GET = async ({ locals }: any) => {
  try {
    const db = locals.runtime?.env?.DB || locals.DB;
    const { results } = await db.prepare('SELECT 1 as health').all();
    
    return new Response(JSON.stringify({ 
      status: 'ok', 
      db_check: results[0].health === 1,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

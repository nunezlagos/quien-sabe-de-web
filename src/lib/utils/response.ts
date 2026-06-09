export const successResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify({ 
      success: true,
      data 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  
  export const errorResponse = (message: string | string[], status: number = 400) => {
    return new Response(JSON.stringify({ 
      success: false,
      error: Array.isArray(message) ? message.join(', ') : message,
      details: Array.isArray(message) ? message : [message]
    }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

// Helper chung để parse lỗi API cho signin/signup (CommonJS or ES module compatible)
export function parseApiError(rawError) {
    const data = rawError?.response?.data ?? rawError ?? {};
    const fieldErrors = {};
    let formError = '';
    
    
    // 1) { errors: { Field: ["msg"] } }
    if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
    Object.entries(data.errors).forEach(([key, val]) => {
    const normalizedKey = String(key).toLowerCase();
    if (Array.isArray(val)) fieldErrors[normalizedKey] = val.filter(Boolean).join('. ');
    else if (typeof val === 'string') fieldErrors[normalizedKey] = val;
    else fieldErrors[normalizedKey] = String(val);
    });
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors, formError: '' };
    }
    
    
    // 2) { message: "..." } -> cố gắng suy ra field
    if (data && (data.message || data.Message)) {
    const msg = data.message ?? data.Message;
    const lower = String(msg).toLowerCase();
    if (lower.includes('username') || lower.includes('tên đăng') || lower.includes('user')) fieldErrors.username = msg;
    else if (lower.includes('email')) fieldErrors.email = msg;
    else if (lower.includes('phone')) fieldErrors.phone = msg;
    else if (lower.includes('password')) fieldErrors.password = msg;
    else formError = msg;
    return { fieldErrors, formError };
    }
    
    
    // 3) title
    if (data?.title) {
    formError = data.title;
    return { fieldErrors: {}, formError };
    }
    
    
    // 4) fallback
    const fallbackMsg = (data && (data.error || data.message || data.detail)) || rawError?.message || 'Sign up failed';
    formError = String(fallbackMsg);
    return { fieldErrors: {}, formError };
    }
    
    
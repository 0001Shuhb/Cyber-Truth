export function isValidUrl(u){ try{ new URL(u); return true;}catch(e){return false;} }
export function isValidEmail(e){ return /.+@.+\..+/.test(e); }

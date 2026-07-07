import { useState } from 'react';
export default function useScan(){ const [result, setResult] = useState(null); return {result,setResult}; }

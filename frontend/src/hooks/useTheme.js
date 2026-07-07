import { useState } from 'react';
export default function useTheme(){ const [theme, setTheme] = useState('light'); return {theme,setTheme}; }

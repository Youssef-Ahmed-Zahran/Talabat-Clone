const fs = require('fs');

const useEarningsPath = './src/features/earnings/hooks/useEarningsScreen.ts';
let useEarnings = fs.readFileSync(useEarningsPath, 'utf8');
useEarnings = useEarnings.replace(
  'return res.data.data?.earnings ?? [];',
  'console.log("[Earnings API res]:", JSON.stringify(res.data, null, 2)); return res.data.data?.earnings ?? [];'
);
fs.writeFileSync(useEarningsPath, useEarnings);

const homeApiPath = './src/features/home/api/home.api.ts';
let homeApi = fs.readFileSync(homeApiPath, 'utf8');
homeApi = homeApi.replace(
  'const profile = profileRes.data.data;',
  'console.log("[Profile API res]:", JSON.stringify(profileRes.data, null, 2)); const profile = profileRes.data.data;'
);
fs.writeFileSync(homeApiPath, homeApi);

console.log("Patched!");

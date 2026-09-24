const fs=require('node:fs');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/vendor',{recursive:true});
for(const file of ['index.html','app.js','cloud.js','style.css','config.js'])fs.copyFileSync(file,'dist/'+file);
fs.copyFileSync('node_modules/@supabase/supabase-js/dist/umd/supabase.js','dist/vendor/supabase.js');
fs.copyFileSync('node_modules/@supabase/supabase-js/LICENSE','dist/vendor/SUPABASE-LICENSE');
fs.writeFileSync('dist/.nojekyll','');
console.log('Static website built in dist/');

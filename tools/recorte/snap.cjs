// Ajusta una silueta trazada a mano al borde real de la pieza: busca, a lo largo de la normal de cada punto,
// el cambio más fuerte de luminosidad (cuero claro -> mesa oscura) y desplaza el punto hasta ahí.
// Uso: node snap.cjs <foto> <silueta.txt> <silueta-ajustada.txt> [ventana=9] [paso=4]
const s=require('sharp');const fs=require('fs');
const [f,inp,out,vent='9',paso='4']=process.argv.slice(2);const V=+vent,P=+paso;
(async()=>{
 const {data,info}=await s(f).removeAlpha().greyscale().blur(1.0).raw().toBuffer({resolveWithObject:true});
 const W=info.width,H=info.height;
 const L=(x,y)=>{x=Math.max(0,Math.min(W-1.001,x));y=Math.max(0,Math.min(H-1.001,y));const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
  return data[y0*W+x0]*(1-fx)*(1-fy)+data[y0*W+x0+1]*fx*(1-fy)+data[(y0+1)*W+x0]*(1-fx)*fy+data[(y0+1)*W+x0+1]*fx*fy};
 const nums=fs.readFileSync(inp,'utf8').match(/-?\d+\.?\d*/g).map(Number);let pts=[];for(let i=0;i<nums.length;i+=2)pts.push([nums[i],nums[i+1]]);
 // densificar
 const den=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/P));for(let k=0;k<n;k++)den.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}
 const N=den.length;
 // orientación
 let area=0;for(let i=0;i<N;i++){const a=den[i],b=den[(i+1)%N];area+=a[0]*b[1]-b[0]*a[1]}
 const sgn=area>0?1:-1; // en coordenadas de imagen (y abajo) area>0 = sentido horario en pantalla
 const off=new Array(N).fill(0),fuerza=new Array(N).fill(0);
 for(let i=0;i<N;i++){
  const a=den[(i-3+N)%N],b=den[(i+3)%N];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;
  const nx=sgn*ty,ny=-sgn*tx; // normal saliente
  let best=0,bg=0;
  for(let t=-V;t<=V;t+=0.5){const g=L(den[i][0]+nx*(t-1),den[i][1]+ny*(t-1))-L(den[i][0]+nx*(t+1),den[i][1]+ny*(t+1));if(g>bg){bg=g;best=t}}
  off[i]=bg>7?best:0;fuerza[i]=bg;
 }
 const med=(arr,r)=>arr.map((_,i)=>{const w=[];for(let k=-r;k<=r;k++)w.push(arr[(i+k+N)%N]);w.sort((x,y)=>x-y);return w[r]});
 const avg=(arr,r)=>arr.map((_,i)=>{let sum=0;for(let k=-r;k<=r;k++)sum+=arr[(i+k+N)%N];return sum/(2*r+1)});
 const suave=avg(med(off,4),2);
 const nuevo=den.map((p,i)=>{const a=den[(i-3+N)%N],b=den[(i+3)%N];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;return [p[0]+sgn*ty*suave[i],p[1]-sgn*tx*suave[i]]});
 fs.writeFileSync(out,'M'+nuevo.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L')+' Z');
 const mx=Math.max(...suave.map(Math.abs));const debiles=fuerza.filter(g=>g<=7).length;
 console.log('puntos',N,'| desplazamiento máx',mx.toFixed(1),'px | media',(suave.reduce((a,b)=>a+Math.abs(b),0)/N).toFixed(2),'px | sin borde claro:',debiles);
})();

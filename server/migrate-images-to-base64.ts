import fs from 'fs';
import path from 'path';
import { storage } from './storage';

export async function migrateImagesToBase64() {
  
  
  const services = await storage.getServices();
  let migratedCount = 0;
  let generatedCount = 0;
  
  for (const service of services) {
    if (service.imageUrl && service.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), service.imageUrl);
      
      if (fs.existsSync(imagePath)) {
        // Arquivo existe - migrar para base64
        try {
          const imageBuffer = fs.readFileSync(imagePath);
          const imageBase64 = imageBuffer.toString('base64');
          
          // Detectar tipo MIME baseado na extensão
          const ext = path.extname(imagePath).toLowerCase();
          let mimeType = 'image/jpeg';
          if (ext === '.png') mimeType = 'image/png';
          if (ext === '.webp') mimeType = 'image/webp';
          
          await storage.updateServiceImageData(service.id, imageBase64, mimeType);
          
          migratedCount++;
        } catch (error) {
          
        }
      } else {
        // Arquivo não existe - gerar imagem padrão em SVG
        const defaultSvg = generateServiceSvg(service.name);
        const svgBase64 = Buffer.from(defaultSvg).toString('base64');
        
        await storage.updateServiceImageData(service.id, svgBase64, 'image/svg+xml');
        
        generatedCount++;
      }
    }
  }
  
  // Verificar banner também
  const banner = await storage.getBanner();
  if (banner && banner.backgroundImage && banner.backgroundImage.startsWith('/uploads/')) {
    const imagePath = path.join(process.cwd(), banner.backgroundImage);
    
    if (fs.existsSync(imagePath)) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        
        await storage.updateBannerImageData(imageBase64, mimeType);
        
        migratedCount++;
      } catch (error) {
        
      }
    } else {
      // Gerar banner padrão
      const defaultBannerSvg = generateBannerSvg();
      const svgBase64 = Buffer.from(defaultBannerSvg).toString('base64');
      
      await storage.updateBannerImageData(svgBase64, 'image/svg+xml');
      
      generatedCount++;
    }
  }
  
  
  
  
  
}

function generateServiceSvg(serviceName: string): string {
  const gradientColors = [
    ['#667eea', '#764ba2'], // Purple
    ['#f093fb', '#f5576c'], // Pink
    ['#4facfe', '#00f2fe'], // Blue
    ['#43e97b', '#38f9d7'], // Green
    ['#ffecd2', '#fcb69f'], // Orange
  ];
  
  const colorIndex = serviceName.length % gradientColors.length;
  const [color1, color2] = gradientColors[colorIndex];
  
  return `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#grad)"/>
    <circle cx="200" cy="120" r="40" fill="rgba(255,255,255,0.3)"/>
    <circle cx="200" cy="120" r="25" fill="rgba(255,255,255,0.5)"/>
    <text x="200" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${serviceName}</text>
    <text x="200" y="230" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="14">Salão de Beleza</text>
  </svg>`;
}

function generateBannerSvg(): string {
  return `<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="800" height="400" fill="url(#bannerGrad)"/>
    <circle cx="400" cy="200" r="80" fill="rgba(255,255,255,0.2)"/>
    <circle cx="400" cy="200" r="50" fill="rgba(255,255,255,0.3)"/>
    <text x="400" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="bold">Ateliê de Beleza</text>
    <text x="400" y="360" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="18">Transformando sua beleza</text>
  </svg>`;
}
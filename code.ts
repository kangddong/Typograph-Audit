// Typography Audit Plugin - 선택된 영역에서 Typography 정보 추출

interface TypographyData {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  textColor?: RGB;
  characters: string;
  location: {
    layerName: string;
    x: number;
    y: number;
  };
}

interface MessageData {
  type: string;
  data?: TypographyData[];
  error?: string;
}

// UI 창 열기 (600x400 크기)
figma.showUI(__html__, { width: 600, height: 400 });

// 선택된 노드에서 Typography 정보 추출
function extractTypography(selectedNode: SceneNode): TypographyData[] {
  const typographyData: TypographyData[] = [];
  
  function traverse(node: SceneNode) {
    if (node.type === 'TEXT') {
      try {
        // TEXT 노드의 색상 정보 추출
        let textColor: RGB | undefined;
        if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
          const solidFill = node.fills.find(fill => fill.type === 'SOLID') as SolidPaint;
          if (solidFill) {
            textColor = solidFill.color;
          }
        }

        typographyData.push({
          fontFamily: node.fontName.family,
          fontWeight: node.fontName.style,
          fontSize: node.fontSize,
          lineHeight: node.lineHeight,
          letterSpacing: node.letterSpacing,
          textColor: textColor,
          characters: node.characters,
          location: {
            layerName: node.name,
            x: Math.round(node.x),
            y: Math.round(node.y)
          }
        });
      } catch (error) {
        console.warn('Error extracting typography from node:', node.name, error);
      }
    }
    
    // 자식 노드 순회
    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }
  
  traverse(selectedNode);
  return typographyData;
}

// UI에서 메시지 받기
figma.ui.onmessage = (msg: MessageData) => {
  if (msg.type === 'extract-typography') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      // 선택된 것이 없으면 현재 페이지 전체 스캔
      const allTypography = extractTypography(figma.currentPage);
      figma.ui.postMessage({
        type: 'typography-extracted',
        data: allTypography
      } as MessageData);
    } else {
      // 선택된 노드들에서 Typography 추출
      const allTypography: TypographyData[] = [];
      
      for (const selectedNode of selection) {
        const nodeTypography = extractTypography(selectedNode);
        allTypography.push(...nodeTypography);
      }
      
      figma.ui.postMessage({
        type: 'typography-extracted',
        data: allTypography
      } as MessageData);
    }
  }
  
  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

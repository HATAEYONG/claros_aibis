/**
 * frontend/src/utils/classNames.ts
 * CSS 클래스명 유틸리티
 */

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: boolean | undefined | null }
  | ClassValue[];

/**
 * Tailwind CSS 클래스명을 조건부로 결합하는 유틸리티
 * clsx + tailwind-merge 기능 통합
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  inputs.forEach((input) => {
    if (!input) return;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = cn(...input);
      if (result) classes.push(result);
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, value]) => {
        if (value) classes.push(key);
      });
    }
  });

  // 중복 제거 및 Tailwind conflict 해결
  return mergeTailwindClasses(classes.join(' '));
}

/**
 * Tailwind CSS 클래스 충돌 해결
 * 같은 속성의 클래스가 여러 개 있을 때 마지막 것만 유지
 */
function mergeTailwindClasses(classNames: string): string {
  const classes = classNames.split(' ').filter(Boolean);
  const classMap = new Map<string, string>();

  // Tailwind 클래스 분류 패턴
  const patterns = {
    // Spacing
    margin: /^-?m[trblxy]?-/,
    padding: /^p[trblxy]?-/,
    space: /^space-[xy]-/,
    gap: /^gap-/,

    // Sizing
    width: /^w-/,
    height: /^h-/,
    minWidth: /^min-w-/,
    maxWidth: /^max-w-/,
    minHeight: /^min-h-/,
    maxHeight: /^max-h-/,

    // Typography
    fontSize: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    fontWeight: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    textAlign: /^text-(left|center|right|justify|start|end)$/,
    textColor: /^text-/,
    lineHeight: /^leading-/,

    // Background
    backgroundColor: /^bg-/,
    backgroundOpacity: /^bg-opacity-/,

    // Border
    borderWidth: /^border(-[trbl])?-?\d*/,
    borderColor: /^border-/,
    borderRadius: /^rounded/,
    borderOpacity: /^border-opacity-/,

    // Display
    display: /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden)$/,

    // Position
    position: /^(static|fixed|absolute|relative|sticky)$/,
    inset: /^(inset|top|right|bottom|left)-/,
    zIndex: /^z-/,

    // Flexbox
    flexDirection: /^flex-(row|col)/,
    flexWrap: /^flex-(wrap|nowrap)/,
    flex: /^flex-/,
    justifyContent: /^justify-/,
    alignItems: /^items-/,
    alignContent: /^content-/,
    alignSelf: /^self-/,

    // Grid
    gridCols: /^grid-cols-/,
    gridRows: /^grid-rows-/,
    gridFlow: /^grid-flow-/,

    // Effects
    opacity: /^opacity-/,
    shadow: /^shadow/,

    // Transforms
    scale: /^scale-/,
    rotate: /^rotate-/,
    translate: /^-?translate-/,
    transform: /^transform/,

    // Transitions
    transition: /^transition/,
    duration: /^duration-/,
    ease: /^ease-/,

    // Cursor
    cursor: /^cursor-/,

    // Overflow
    overflow: /^overflow-/,
  };

  classes.forEach((cls) => {
    let category = 'other';

    // 카테고리 찾기
    for (const [cat, pattern] of Object.entries(patterns)) {
      if (pattern.test(cls)) {
        category = cat;
        break;
      }
    }

    // 같은 카테고리의 이전 클래스 덮어쓰기
    classMap.set(category, cls);
  });

  return Array.from(classMap.values()).join(' ');
}

/**
 * 조건부 클래스 헬퍼
 */
export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass?: string
): string => {
  return condition ? trueClass : falseClass || '';
};

/**
 * 변형 클래스 헬퍼
 */
export const variantClass = <T extends string>(
  variants: Record<T, string>,
  variant: T,
  defaultVariant?: T
): string => {
  return variants[variant] || (defaultVariant ? variants[defaultVariant] : '');
};

/**
 * 사이즈 클래스 헬퍼
 */
export const sizeClass = <T extends string>(
  sizes: Record<T, string>,
  size: T,
  defaultSize?: T
): string => {
  return sizes[size] || (defaultSize ? sizes[defaultSize] : '');
};

// Export all utilities
export default cn;

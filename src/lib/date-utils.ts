/**
 * Utilidad para parsear fechas de diferentes formatos
 * Maneja formatos como YYYY-MM-DD, DD MMM YYYY, etc.
 */
export function parseEventDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    // Formato 1: YYYY-MM-DD (ISO)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Formato 2: DD MMM YYYY (ej: "10 ENE 2026")
    if (dateString.match(/^\d{1,2}\s+\w{3}\s+\d{4}$/i)) {
      const months: { [key: string]: number } = {
        // Español
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
        // Inglés
        'jan': 0, 'apr': 3, 'aug': 7, 'dec': 11,
      };
      const parts = dateString.toLowerCase().split(/\s+/);
      if (parts.length === 3 && months[parts[1]] !== undefined) {
        const date = new Date(
          parseInt(parts[2]),
          months[parts[1]],
          parseInt(parts[0])
        );
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Formato 3: Intentar parseo automático
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
  }
  
  return null;
}

/**
 * Formatear fecha para mostrar en la UI
 */
export function formatEventDate(dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '';
  
  const parsedDate = parseEventDate(dateString);
  if (!parsedDate) return dateString; // Retornar el string original si no se puede parsear
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  };
  
  try {
    return parsedDate.toLocaleDateString('es-ES', defaultOptions);
  } catch (error) {
    console.warn(`Error formatting date: ${dateString}`, error);
    return dateString;
  }
}

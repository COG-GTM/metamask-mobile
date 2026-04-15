




export const isPreDefinedKeyValueRowLabel = (
label) =>

!!label && typeof label === 'object' && 'text' in label;
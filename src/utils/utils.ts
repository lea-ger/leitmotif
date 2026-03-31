import {DATA_TYPE_COLORS, type DataType} from "../nodes";

export function getDataTypeColor(dataType: DataType): string {
  return DATA_TYPE_COLORS[dataType] || '#6b7280'
}
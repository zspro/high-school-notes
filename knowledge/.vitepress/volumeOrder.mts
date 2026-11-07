// .vitepress/volumeOrder.mts
// 册目录（如"数学必修二笔记"）没有数字前缀，插件默认按文件名排序会得到
// "必修一、必修三、必修二"这样的顺序。这里按教材顺序给出权重。

const volumes = [
  '必修一',
  '必修二',
  '必修三',
  '选择性必修一',
  '选择性必修二',
  '选择性必修三',
]

/** 根据名称中包含的册名返回排序权重，未识别的排在最后 */
export function volumeRank(name: string): number {
  // 先匹配更长的"选择性必修X"，避免被"必修X"抢先命中
  for (let i = volumes.length - 1; i >= 0; i--) {
    if (name.includes(volumes[i])) return i
  }
  return volumes.length
}

/** 按册顺序稳定排序 */
export function sortByVolume<T>(items: T[], getName: (item: T) => string): T[] {
  return [...items].sort((a, b) => volumeRank(getName(a)) - volumeRank(getName(b)))
}

# Markdown 语法速览

这篇文章展示了本博客支持的常用 Markdown 语法,方便你写作时参考。

## 标题

用 `#` 表示标题,数量代表层级(1-6 级)。

## 文本样式

- **粗体**:`**粗体**`
- *斜体*:`*斜体*`
- ~~删除线~~:`~~删除线~~`
- `行内代码`:反引号包裹

## 列表

无序列表:

- 苹果
- 香蕉
  - 香蕉牛奶
  - 香蕉蛋糕
- 橘子

有序列表:

1. 第一步
2. 第二步
3. 第三步

## 引用

> 这是一段引用文字。
>
> 引用可以有多个段落。

## 代码块

支持语法高亮,在反引号后标注语言:

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
greet("World");
```

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## 表格

| 语言       | 类型     | 年份 |
| ---------- | -------- | ---- |
| JavaScript | 脚本     | 1995 |
| Python     | 通用     | 1991 |
| Rust       | 系统     | 2010 |

## 链接与图片

链接:[CodeBuddy](https://cnb.cool)

图片:`![描述](图片地址)`

## 分割线

用三个或以上的 `-` 表示:

---

以上就是常用语法,更多写法可以参考 [CommonMark 规范](https://commonmark.org/)。

import type { Element, ElementContent, Root } from 'hast'
import { visit } from 'unist-util-visit'

export const rehypeCollapsibleToc = () => {
	return (tree: Root) => {
		const rootOlElement: Element = {
			type: 'element',
			tagName: 'ol',
			properties: {
				className: ['rehype-toc-ol']
			},
			children: []
		}

		visit(tree, 'element', node => {
			visitorCallback(node, rootOlElement)
		})

		const detailsElement = createCollapsibleToc(rootOlElement)
		tree.children.unshift(detailsElement)
	}
}

const visitorCallback = (node: Element, rootOlElement: Element) => {
	if (!/^h[2-6]$/.test(node.tagName)) {
		return
	}

	const headingLevel = getHeadingLevelFromElement(node)
	const liElement = createListItemElement(node)
	const rootOlElementChildren = assertElementNodeList(rootOlElement.children)

	// h2ならolに直接追加
	if (headingLevel === 2) {
		rootOlElement.children.push(liElement)
		return
	}

	// 一番新しいliから、同じレベルのheadingを入れているolを探す
	const rootElementHeadingLevel = 2
	const sameLevelOlElement = searchSameLevelOlElement(
		rootOlElement,
		headingLevel,
		rootElementHeadingLevel
	)
	if (sameLevelOlElement) {
		sameLevelOlElement.children.push(liElement)
		return
	}

	// 一番新しいliの一番深いところに新しくolを作って追加
	const deepestLiElement = getDeepestLiElement(rootOlElementChildren)
	const newOlElement = createOlElement()
	newOlElement.children.push(liElement)
	deepestLiElement.children.push(newOlElement)
}

/**
 * 引数のolに入っている一番新しいliの中で、levelと同じ見出しレベルのli要素を返す
 */
const searchSameLevelOlElement = (
	rootOlElement: Element,
	level: number,
	rootElementHeadingLevel: number
): Element | undefined => {
	const rootLiElement = assertElementNode(
		rootOlElement.children[rootOlElement.children.length - 1]
	)
	if (level === rootElementHeadingLevel) {
		return rootOlElement
	}

	const childOlElement = assertElementNodeList(rootLiElement.children)[1]
	if (childOlElement === undefined) {
		return
	}

	return searchSameLevelOlElement(
		childOlElement,
		level,
		rootElementHeadingLevel + 1
	)
}

/**
 * 引数のolに入っている一番新しいliの中で、一番深いli要素を取得する
 */
const getDeepestLiElement = (rootOlElement: Element[]): Element => {
	const rootLiElement = assertElementNode(
		rootOlElement[rootOlElement.length - 1]
	)

	const olElement = assertElementNodeList(rootLiElement.children)[1]
	if (!olElement) {
		return rootLiElement
	}

	return getDeepestLiElement(assertElementNodeList(olElement.children))
}

const getHeadingLevelFromElement = (headingElement: Element) => {
	const headingLevel = Number(headingElement.tagName.charAt(1))
	return headingLevel
}

const createOlElement = (): Element => {
	return {
		type: 'element',
		tagName: 'ol',
		properties: {
			className: ['rehype-toc-ol']
		},
		children: []
	}
}

const createListItemElement = (node: Element): Element => {
	const headingChildren = node.children.flatMap(child =>
		child.type === 'element' ? child.children : []
	)
	const headingTextElement = headingChildren.find(
		child => child.type === 'text'
	)
	if (!headingTextElement) {
		throw new Error('見出しにテキストがありません')
	}

	const headingId = node.properties.id
	const headingText = headingTextElement.value

	const anchorElement: Element = {
		type: 'element',
		tagName: 'a',
		properties: { href: `#${headingId}`, className: ['rehype-toc-a'] },
		children: [{ type: 'text', value: headingText }]
	}

	return {
		type: 'element',
		tagName: 'li',
		properties: {
			className: ['rehype-toc-li']
		},
		children: [anchorElement]
	}
}

const createCollapsibleToc = (rootOlElement: Element): Element => {
	const summaryElement: Element = {
		type: 'element',
		tagName: 'summary',
		properties: {
			className: ['rehype-toc-summary']
		},
		children: [{ type: 'text', value: '目次' }]
	}
	const detailsElement: Element = {
		type: 'element',
		tagName: 'details',
		properties: {
			open: true, // TODO: 設定できるようにする
			className: ['rehype-toc-details']
		},
		children: [summaryElement, rootOlElement]
	}

	return detailsElement
}

const assertElementNode = (node: ElementContent): Element => {
	if (node.type !== 'element') {
		throw new Error('Elementノードではありません')
	}
	return node
}

const assertElementNodeList = (nodeList: ElementContent[]): Element[] => {
	if (nodeList.some(node => node.type !== 'element')) {
		throw new Error('Elementノードではありません')
	}
	return nodeList as Element[]
}

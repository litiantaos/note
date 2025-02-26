import { setCaretAfterNode } from './caret'
import { contentType, getContentType } from './note'

export const createMarker = ({
  id,
  type,
  name,
  readonly = false,
  onClick,
  onRemove,
}) => {
  const marker = document.createElement('content')
  marker.setAttribute('contenteditable', false)
  marker.setAttribute('data-id', id)
  marker.setAttribute('data-type', type)
  marker.setAttribute('data-name', name)

  marker.innerHTML = `
    <i class="${contentType[getContentType(type)].icon} ${contentType[getContentType(type)].color} content-marker-icon"></i>
    <span class="content-marker-name">${name}</span>
  `

  if (!readonly) {
    const removeBtn = document.createElement('button')
    removeBtn.className = 'ri-close-line'
    marker.appendChild(removeBtn)

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      onRemove?.(marker)
    })
  }

  marker.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick?.(marker)
    setCaretAfterNode(marker)
  })

  return marker
}

export const findContentIndex = (contents, id) => {
  return contents.findIndex((item) => item.id === id)
}

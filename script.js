document.addEventListener("DOMContentLoaded", () => {
  const fabric = window.fabric
  const bootstrap = window.bootstrap
  const canvas = new fabric.Canvas("memeCanvas")
  let currentMemeDataUrl = null
  const shareModal = new bootstrap.Modal(document.getElementById("shareModal"))

  function resizeCanvas() {
    const container = document.querySelector(".canvas-container")
    const containerWidth = container.clientWidth - 40
    // const size = Math.min(containerWidth, 900)
    const size = Math.min(containerWidth, 600)
    canvas.setDimensions({
      width: size,
      height: size,
    })
    canvas.renderAll()
  }

  resizeCanvas()
  window.addEventListener("resize", resizeCanvas)

  document.getElementById("imageUpload").addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        canvas.clear()
        const canvasWidth = canvas.getWidth()
        const canvasHeight = canvas.getHeight()
        // console.log("W ", canvasWidth, "H ", canvasHeight)
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)
        img.scale(scale)
        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: "center",
          originY: "center",
          selectable: false,
        })
        canvas.add(img)
        canvas.sendToBack(img)
        addDefaultTexts()
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
  })

  function addDefaultTexts() {
    const topTextValue = document.getElementById("topText").value
    const bottomTextValue = document.getElementById("bottomText").value

    if (topTextValue) {
      addMemeText(topTextValue, "top")
    }

    if (bottomTextValue) {
      addMemeText(bottomTextValue, "bottom")
    }
  }

  document.getElementById("topText").addEventListener("input", function () {
    updateMemeText(this.value, "top")
  })

  document.getElementById("bottomText").addEventListener("input", function () {
    updateMemeText(this.value, "bottom")
  })

  document.getElementById("addCustomText").addEventListener("click", () => {
    const customText = document.getElementById("customText").value
    if (customText) {
      addMemeText(customText, "custom")
      document.getElementById("customText").value = ""
    }
  })

  function addMemeText(text, position) {
    const fontSize = Number.parseInt(document.getElementById("fontSize").value)
    const textColor = document.getElementById("textColor").value
    const strokeColor = document.getElementById("strokeColor").value
    const strokeWidth = Number.parseFloat(document.getElementById("strokeWidth").value)

    const existingTexts = canvas
      .getObjects()
      .filter((obj) => obj.type === "text" && obj.position === position && position !== "custom")

    existingTexts.forEach((obj) => canvas.remove(obj))

    const textObj = new fabric.Text(text, {
      fontFamily: "Impact",
      fontSize: fontSize,
      fill: textColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      textAlign: "center",
      originX: "center",
      originY: "center",
      position: position,
      shadow: new fabric.Shadow({
        color: "rgba(0,0,0,0.3)",
        blur: 5,
        offsetX: 2,
        offsetY: 2,
      }),
    })

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()

    if (position === "top") {
      textObj.set({
        top: 50,
        left: canvasWidth / 2,
      })
    } else if (position === "bottom") {
      textObj.set({
        top: canvasHeight - 50,
        left: canvasWidth / 2,
      })
    } else {
      textObj.set({
        top: canvasHeight / 2,
        left: canvasWidth / 2,
      })
    }

    canvas.add(textObj)
    canvas.setActiveObject(textObj)
    canvas.renderAll()
  }

  function updateMemeText(text, position) {
    const existingTexts = canvas.getObjects().filter((obj) => obj.type === "text" && obj.position === position)

    if (existingTexts.length > 0) {
      existingTexts[0].set("text", text)
      canvas.renderAll()
    } else if (text) {
      addMemeText(text, position)
    }
  }

  document.getElementById("fontSize").addEventListener("input", updateTextProperties)
  document.getElementById("textColor").addEventListener("input", updateTextProperties)
  document.getElementById("strokeColor").addEventListener("input", updateTextProperties)
  document.getElementById("strokeWidth").addEventListener("input", updateTextProperties)

  function updateTextProperties() {
    const fontSize = Number.parseInt(document.getElementById("fontSize").value)
    const textColor = document.getElementById("textColor").value
    const strokeColor = document.getElementById("strokeColor").value
    const strokeWidth = Number.parseFloat(document.getElementById("strokeWidth").value)

    const activeObject = canvas.getActiveObject()
    if (activeObject && activeObject.type === "text") {
      activeObject.set({
        fontSize: fontSize,
        fill: textColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      })
      canvas.renderAll()
    }
  }

  document.getElementById("downloadBtn").addEventListener("click", () => {
    if (canvas.getObjects().length === 0) {
      alert("Veuillez d'abord ajouter une image !")
      return
    }

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
    })

    const link = document.createElement("a")
    link.href = dataUrl
    link.download = "mon-meme.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    currentMemeDataUrl = dataUrl
  })

  document.getElementById("shareBtn").addEventListener("click", () => {
    if (canvas.getObjects().length === 0) {
      alert("Veuillez d'abord ajouter une image !")
      return
    }

    if (!currentMemeDataUrl) {
      currentMemeDataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
      })
    }

    if (navigator.share) {
      shareWithWebShareAPI()
    } else {
      shareModal.show()
    }
  })

  async function shareWithWebShareAPI() {
    try {
      const blob = await dataURLtoBlob(currentMemeDataUrl)
      const file = new File([blob], "mon-meme.png", { type: "image/png" })

      const shareData = {
        title: "Sup Mème pro",
        text: "Regardez le mème que j'ai créé !",
        files: [file],
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        showToast("Mème partagé avec succès !", "success")
      } else {
        await navigator.share({
          title: "Mon mème",
          text: "Regardez le mème que j'ai créé !",
          url: currentMemeDataUrl,
        })
        showToast("Lien du mème partagé avec succès !", "success")
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error)

      if (error.name !== "AbortError") {
        showToast("Impossible de partager le mème. Essayez de le télécharger d'abord.", "danger")
      }

      shareModal.show()
    }
  }

  function dataURLtoBlob(dataURL) {
    return new Promise((resolve) => {
      const arr = dataURL.split(",")
      const mime = arr[0].match(/:(.*?);/)[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }

      resolve(new Blob([u8arr], { type: mime }))
    })
  }

  function showToast(message, type = "info") {
    const toastContainer = document.createElement("div")
    toastContainer.className = "position-fixed bottom-0 end-0 p-3"
    toastContainer.style.zIndex = "11"

    const toastElement = document.createElement("div")
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`
    toastElement.setAttribute("role", "alert")
    toastElement.setAttribute("aria-live", "assertive")
    toastElement.setAttribute("aria-atomic", "true")

    const icon = type === "success" ? "check-circle" : type === "danger" ? "exclamation-circle" : "info-circle"

    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${icon} me-2"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `

    toastContainer.appendChild(toastElement)
    document.body.appendChild(toastContainer)

    const toastInstance = new bootstrap.Toast(toastElement)
    toastInstance.show()

    setTimeout(() => {
      document.body.removeChild(toastContainer)
    }, 5000)
  }

  document.querySelectorAll(".share-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const platform = this.getAttribute("data-platform")
      shareMeme(platform)
    })
  })

  function shareMeme(platform) {
    if (!currentMemeDataUrl) {
      currentMemeDataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
      })
    }

    const text = encodeURIComponent("Regardez le mème que j'ai créé !")
    let shareUrl = ""

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentMemeDataUrl}`
        break

      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`
        break

      case "whatsapp":
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          shareUrl = `whatsapp://send?text=${text}`
        } else {
          shareUrl = `https://web.whatsapp.com/send?text=${text}`
        }
        break
    }

    window.open(shareUrl, "_blank")
    shareModal.hide()
  }

  function downloadMeme() {
    const link = document.createElement("a")
    link.href = currentMemeDataUrl
    link.download = "mon-meme.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  document.getElementById("saveToGalleryBtn").addEventListener("click", () => {
    if (canvas.getObjects().length === 0) {
      alert("Veuillez d'abord ajouter une image !")
      return
    }

    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 0.8,
    })

    saveMemeToLocalStorage(dataUrl)
    updateGallery()

    showToast("Mème sauvegardé dans la galerie !", "success")
  })

  document.getElementById("resetBtn").addEventListener("click", () => {
    canvas.clear()
    document.getElementById("topText").value = ""
    document.getElementById("bottomText").value = ""
    document.getElementById("customText").value = ""
    document.getElementById("imageUpload").value = ""
  })

  function saveMemeToLocalStorage(dataUrl) {
    const savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || []
    savedMemes.push({
      id: Date.now(),
      dataUrl: dataUrl,
      date: new Date().toLocaleString(),
    })
    localStorage.setItem("savedMemes", JSON.stringify(savedMemes))
  }

  function updateGallery() {
    const gallery = document.getElementById("memeGallery")
    const savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || []

    gallery.innerHTML = ""

    if (savedMemes.length === 0) {
      gallery.innerHTML =
        "<div class='col-12'><p class='text-center py-5'>Aucun mème sauvegardé. Créez votre premier mème !</p></div>"
      return
    }

    savedMemes.forEach((meme) => {
      const memeItem = document.createElement("div")
      memeItem.className = "col-lg-3 col-md-4 col-sm-6"
      memeItem.innerHTML = `
        <div class="gallery-item">
          <img src="${meme.dataUrl}" alt="Mème sauvegardé">
          <div class="overlay">
            <button class="view-btn" data-id="${meme.id}"><i class="fas fa-eye"></i></button>
            <button class="delete-btn" data-id="${meme.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `
      gallery.appendChild(memeItem)
    })

    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const memeId = Number.parseInt(this.getAttribute("data-id"))
        viewMeme(memeId)
      })
    })

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const memeId = Number.parseInt(this.getAttribute("data-id"))
        deleteMeme(memeId)
      })
    })
  }

  function viewMeme(memeId) {
    const savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || []
    const meme = savedMemes.find((m) => m.id === memeId)

    if (meme) {
      fabric.Image.fromURL(meme.dataUrl, (img) => {
        canvas.clear()
        const canvasWidth = canvas.getWidth()
        const canvasHeight = canvas.getHeight()
        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)
        img.scale(scale)
        img.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: "center",
          originY: "center",
        })
        canvas.add(img)
        canvas.renderAll()
        document.querySelector(".canvas-container").scrollIntoView({
          behavior: "smooth",
        })
      })
    }
  }

  function deleteMeme(memeId) {
    const confirmModal = new bootstrap.Modal(document.createElement("div"))
    const modalContainer = document.createElement("div")
    modalContainer.className = "modal fade"
    modalContainer.setAttribute("tabindex", "-1")

    modalContainer.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="fas fa-exclamation-triangle me-2"></i>Confirmation</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <p>Êtes-vous sûr de vouloir supprimer ce mème ?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-danger" id="confirmDelete">Supprimer</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modalContainer)
    const modal = new bootstrap.Modal(modalContainer)
    modal.show()

    document.getElementById("confirmDelete").addEventListener("click", () => {
      let savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || []
      savedMemes = savedMemes.filter((meme) => meme.id !== memeId)
      localStorage.setItem("savedMemes", JSON.stringify(savedMemes))
      updateGallery()
      modal.hide()

      setTimeout(() => {
        document.body.removeChild(modalContainer)
      }, 500)
    })
  }

  updateGallery()
})

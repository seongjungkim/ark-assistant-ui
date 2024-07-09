
function onDragEnter_(e) {
    e.preventDefault();
    this.dragCount += 1;
    if (this.dragCount === 1) {
        this.dialogState_ = DialogState.DRAGGING
    }
}
function onDragOver_(e) {
    e.preventDefault()
}

function onDragLeave_(e) {
    e.preventDefault();
    this.dragCount -= 1;
    if (this.dragCount === 0) {
        this.dialogState_ = DialogState.NORMAL
    }
}
function onDrop_(e) {
    e.preventDefault();
    this.dragCount = 0;
    if (e.dataTransfer) {
        this.$.lensForm.submitFileList(e.dataTransfer.files);
        recordLensUploadDialogAction(LensUploadDialogAction.IMAGE_DROPPED)
    }
}
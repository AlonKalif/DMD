#### Image Upload Flow
```
User selects file
  → POST /api/v1/images/upload (multipart/form-data)
  → Backend saves to public/images/
  → fsnotify detects new file
  → Image Service syncs DB (creates ImageEntry)
  → WebSocket broadcast: {type: "images_updated"}
  → Frontend receives event
  → Redux dispatch(fetchImages())
  → UI updates with new image
```

#### Show to Players Flow
```
DM clicks "Show To Players"
  → BroadcastChannel.postMessage({type: 'show_layout', payload})
  → Player Window receives message
  → Redux dispatch(setCurrentLayout(payload))
  → Player display updates instantly
```
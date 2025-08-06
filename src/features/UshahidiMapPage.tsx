import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function UshahidiMapPage() {
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current) return // prevent duplicate map

    const map = L.map('ushahidi-map').setView([20, 78], 5)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    fetch('https://skillpedia.api.ushahidi.io/api/v3/posts')
      .then(res => res.json())
      .then(data => {
        const posts = data.results
        posts.forEach(post => {
          const locationArray = post.values?.['f6c07bf1-50fe-45dc-9939-630356ad3b8a']
          if (Array.isArray(locationArray) && locationArray.length > 0) {
            const { lat, lon } = locationArray[0]
            L.marker([lat, lon])
              .addTo(map)
              .bindPopup(`<b>${post.title || 'No Title'}</b><br>${post.content || ''}`)
          }
        })
      })
      .catch(err => console.error('Failed to load posts:', err))
  }, [])

  return (
    <div className="w-full h-screen">
      <div id="ushahidi-map" className="w-full h-full rounded-md" />
    </div>
  )
}

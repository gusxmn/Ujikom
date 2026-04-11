# Package Tracking Database & API Documentation

## Database Schema

### Models

#### `PackageTracking`
Menyimpan informasi tracking utama untuk paket yang dikirim.

| Field | Type | Descrip | tion |
|-------|------|-------|
| id | Int | Primary Key |
| trackingNumber | String (Unique) | Nomor tracking unik |
| orderId | Int (Foreign Key) | Order yang terkait |
| status | Enum | PENDING, IN_WAREHOUSE, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED |
| carrier | String | Nama kurir (JNE, Pos Indonesia, TIKI, dll) |
| shippingAddress | Json | Alamat pengiriman |
| estimatedDelivery | DateTime | Perkiraan tiba |
| actualDelivery | DateTime | Waktu nyata tiba (nullable) |
| currentLocation | String | Lokasi terakhir |
| metadata | Json | Data tambahan (nullable) |
| createdAt | DateTime | Waktu dibuat |
| updatedAt | DateTime | Waktu update terakhir |

#### `PackageTrackingHistory`
Menyimpan riwayat perjalanan paket (timeline).

| Field | Type | Description |
|-------|------|-------|
| id | Int | Primary Key |
| trackingId | Int (Foreign Key) | Referensi ke PackageTracking |
| status | Enum | Status saat itu |
| location | String | Lokasi |
| description | String | Deskripsi event |
| timestamp | DateTime | Waktu event |
| createdAt | DateTime | Waktu dibuat |

---

## API Endpoints

### 1. Search Package by Tracking Number (Public)
```
GET /api/package-tracking/search/:trackingNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "trackingNumber": "TRK123456789",
    "status": "IN_TRANSIT",
    "carrier": "JNE",
    "currentLocation": "Jakarta Hub",
    "estimatedDelivery": "2026-04-15T00:00:00Z",
    "actualDelivery": null,
    "shippingAddress": {...},
    "order": {
      "id": 1,
      "orderNumber": "ORD-20260411-0001",
      "status": "SHIPPED",
      "totalAmount": 1200000,
      "createdAt": "2026-04-11T00:00:00Z"
    },
    "timeline": [
      {
        "status": "PENDING",
        "location": "Warehouse Jakarta",
        "description": "Paket sedang diproses",
        "timestamp": "2026-04-11T10:30:00Z"
      },
      // ... more events
    ]
  }
}
```

### 2. Get Tracking by Order ID (Protected - Customer)
```
GET /api/package-tracking/order/:orderId
```

**Auth:** JWT Token + User ownership verification

---

### 3. Get My Shipments (Protected - Customer)
```
GET /api/package-tracking/my-shipments
```

**Response:** Array of user's package trackings dengan latest update

---

### 4. Get All Trackings (Protected - Admin)
```
GET /api/package-tracking/admin/all
```

**Auth:** JWT Token + Admin role required

---

## Seeding Data

Database sudah di-seed dengan:
- ✅ 35 orders dengan berbagai status
- ✅ Package tracking untuk semua shipped/delivered orders
- ✅ Complete timeline history untuk setiap tracking
- ✅ Multiple carriers (JNE, Pos Indonesia, TIKI, Ninja Express, SiCepat)
- ✅ Demo tracking numbers untuk testing

### Test Tracking Numbers (dari Seeding):
Lihat di database dengan query:
```sql
SELECT trackingNumber, status FROM package_tracking LIMIT 10;
```

---

## Status Enums

```
PENDING         - Paket sedang diproses
IN_WAREHOUSE    - Paket di warehouse
SHIPPED         - Paket dikirim dari warehouse
IN_TRANSIT      - Paket dalam perjalanan
OUT_FOR_DELIVERY - Paket siap diantar
DELIVERED       - Paket sudah tiba
FAILED          - Pengiriman gagal
```

---

## Integration Notes

### Frontend Updates
- Track-package page sudah connected ke API backend
- Auto-search saat ada query parameter `?tracking=TRK123...`
- Support manual tracking number input

### API Flow
1. User memasukkan tracking number atau klik tracking dari orders page
2. Frontend hit `GET /api/package-tracking/search/:trackingNumber`
3. Backend query database dengan JOIN ke Order dan TrackingHistory
4. Return formatted response dengan timeline

### Migration Info
- Migration file: `20260411051627_add_package_tracking`
- Tables created: `package_tracking`, `package_tracking_history`
- Foreign keys: `package_tracking.orderId` ↔ `orders.id`

---

## Usage Examples

### Get Tracking untuk Order
```typescript
const tracking = await fetch('/api/package-tracking/search/TRK123456789');
const data = await tracking.json();
```

### From Next.js Frontend
```typescript
import { api } from '@/lib/api';

const handleSearch = async (trackingNumber: string) => {
  const response = await api.get(`/package-tracking/search/${trackingNumber}`);
  const trackingData = response.data.data;
  // Use trackingData...
}
```

---

## Future Enhancements
- [ ] Webhook integration untuk update real-time dari courier
- [ ] SMS/Email notification saat status berubah
- [ ] Admin dashboard untuk manage tracking
- [ ] Bulk tracking import
- [ ] QR code tracking
- [ ] Multi-language support


export const mockVideoData = [
  {
    id: "1",
    name: "Downtown Traffic Morning Rush",
    date: "2023-05-02",
    duration: "2:15",
    size: "145 MB",
    status: "processed",
    progress: 100,
    thumbnail: "https://images.unsplash.com/photo-1574767848755-475ec68136e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60",
    detectionResults: {
      car: 156,
      truck: 23,
      bus: 12,
      motorcycle: 42
    }
  },
  {
    id: "2",
    name: "Highway Surveillance Cam",
    date: "2023-05-06",
    duration: "5:32",
    size: "320 MB",
    status: "processed",
    progress: 100,
    thumbnail: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60",
    detectionResults: {
      car: 432,
      truck: 78,
      bus: 25,
      motorcycle: 17
    }
  },
  {
    id: "3",
    name: "Busy Intersection Analysis",
    date: "2023-05-10",
    duration: "4:10",
    size: "275 MB",
    status: "processing",
    progress: 65,
    thumbnail: "https://images.unsplash.com/photo-1469461084727-4bfb496cf55a?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60",
    detectionResults: {
      car: 0,
      truck: 0,
      bus: 0,
      motorcycle: 0
    }
  },
  {
    id: "4",
    name: "Evening Traffic Flow",
    date: "2023-05-12",
    duration: "3:45",
    size: "208 MB",
    status: "processed",
    progress: 100,
    thumbnail: "https://images.unsplash.com/photo-1612886649125-ee44f38a90e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60",
    detectionResults: {
      car: 245,
      truck: 15,
      bus: 18,
      motorcycle: 52
    }
  },
  {
    id: "5",
    name: "Rural Road Surveillance",
    date: "2023-05-15",
    duration: "6:20",
    size: "350 MB",
    status: "processed",
    progress: 100,
    thumbnail: "https://images.unsplash.com/photo-1495340434142-58967c178956?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=60",
    detectionResults: {
      car: 87,
      truck: 45,
      bus: 3,
      motorcycle: 8
    }
  }
];

export const mockDetectionData = {
  timeSeries: [
    { time: "00:00", car: 25, truck: 10, bus: 5, motorcycle: 15 },
    { time: "00:05", car: 30, truck: 12, bus: 4, motorcycle: 18 },
    { time: "00:10", car: 35, truck: 15, bus: 6, motorcycle: 22 },
    { time: "00:15", car: 45, truck: 18, bus: 8, motorcycle: 28 },
    { time: "00:20", car: 50, truck: 20, bus: 10, motorcycle: 32 },
    { time: "00:25", car: 45, truck: 18, bus: 9, motorcycle: 30 },
    { time: "00:30", car: 40, truck: 15, bus: 7, motorcycle: 25 }
  ],
  totalCount: {
    car: 270,
    truck: 108,
    bus: 49,
    motorcycle: 170
  }
};

 "use client";
import { Box, Skeleton, Card, CardContent, Grid } from "@mui/material";

export default function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      {/* 🔄 Top Filter Section Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {/* Showing results skeleton */}
          <Skeleton variant="text" width={200} height={25} animation="wave" />
          
          {/* Sort dropdown skeleton */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={120} height={40} animation="wave" />
            <Skeleton variant="rectangular" width={100} height={40} animation="wave" />
          </Box>
        </Box>
      </Box>

      {/* 🔄 Featured Listings Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={200} height={30} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={40} height={32} animation="wave" />
            <Skeleton variant="rectangular" width={40} height={32} animation="wave" />
          </Box>
        </Box>
        
        {/* Featured Swiper Skeleton */}
        <Grid container spacing={2}>
          {Array.from({ length: 2 }).map((_, index) => (
<Grid   size={{ xs: 6, md: 6 }}  >
              <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Skeleton variant="rectangular" height={160} animation="wave" />
                <CardContent>
                  <Skeleton variant="text" height={28} width="70%" animation="wave" />
                  <Skeleton variant="text" height={22} width="50%" animation="wave" />
                  <Box sx={{ mt: 1 }}>
                    <Skeleton variant="text" height={18} width="80%" animation="wave" />
                    <Skeleton variant="text" height={18} width="60%" animation="wave" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rectangular" width="45%" height={35} animation="wave" />
                    <Skeleton variant="rectangular" width="45%" height={35} animation="wave" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 🔄 Premium/Spotlight Section Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={180} height={30} animation="wave" />
        </Box>
        
        <Grid container spacing={3}>
          {Array.from({ length: 2 }).map((_, index) => (
<Grid   size={{ xs: 12, md: 6 }}  >
              <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {/* Image with badge skeleton */}
                <Box sx={{ position: 'relative' }}>
                  <Skeleton variant="rectangular" height={200} animation="wave" />
                  <Skeleton 
                    variant="rectangular" 
                    width={100} 
                    height={24} 
                    animation="wave"
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10,
                      borderRadius: 1 
                    }} 
                  />
                </Box>
                
                <CardContent>
                  <Skeleton variant="text" height={30} width="70%" animation="wave" />
                  <Skeleton variant="text" height={25} width="50%" animation="wave" />
                  <Skeleton variant="text" height={25} width="40%" animation="wave" />

                  {/* Details list skeleton */}
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" height={20} width="80%" animation="wave" />
                    <Skeleton variant="text" height={20} width="60%" animation="wave" />
                    <Skeleton variant="text" height={20} width="70%" animation="wave" />
                  </Box>

                  {/* Condition/Location skeleton */}
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={20} width="40%" animation="wave" />
                  </Box>

                  {/* Buttons skeleton */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                    <Skeleton variant="rectangular" width="40%" height={35} animation="wave" />
                    <Skeleton variant="rectangular" width="40%" height={35} animation="wave" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 🔄 Main Products Grid Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, index) => (
<Grid   size={{ xs: 12, md: 6 }}  >
              <Card
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {/* 🖼 Image Section with Swiper dots */}
                <Box sx={{ position: 'relative' }}>
                  <Skeleton variant="rectangular" height={200} animation="wave" />
                  
                  {/* Swiper pagination dots skeleton */}
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 10, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 1
                  }}>
                    {[1, 2, 3, 4].map((dot) => (
                      <Skeleton 
                        key={dot}
                        variant="circular" 
                        width={8} 
                        height={8} 
                        animation="wave"
                      />
                    ))}
                  </Box>
                  
                  {/* Spotlight badge */}
                  <Skeleton 
                    variant="rectangular" 
                    width={120} 
                    height={24} 
                    animation="wave"
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10,
                      borderRadius: 1 
                    }} 
                  />
                </Box>

                {/* 📦 Card Content */}
                <CardContent>
                  {/* 🏷 Title */}
                  <Skeleton variant="text" height={30} width="70%" animation="wave" />
                  
                  {/* 💰 Price lines */}
                  <Skeleton variant="text" height={25} width="50%" animation="wave" />
                  <Skeleton variant="text" height={25} width="40%" animation="wave" />

                  {/* 📋 Details List */}
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" height={20} width="80%" animation="wave" />
                    <Skeleton variant="text" height={20} width="60%" animation="wave" />
                    <Skeleton variant="text" height={20} width="70%" animation="wave" />
                  </Box>

                  {/* 📍 Bottom info (Condition / Location) */}
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={20} width="40%" animation="wave" />
                  </Box>

                  {/* 🔘 Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      mt: 2,
                    }}
                  >
                    <Skeleton variant="rectangular" width="40%" height={35} animation="wave" />
                    <Skeleton variant="rectangular" width="40%" height={35} animation="wave" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 🔄 Pagination Skeleton */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Skeleton variant="rectangular" width={80} height={36} animation="wave" />
          <Skeleton variant="text" width={100} height={25} animation="wave" />
          <Skeleton variant="rectangular" width={80} height={36} animation="wave" />
        </Box>
      </Box>
    </Box>
  );
}
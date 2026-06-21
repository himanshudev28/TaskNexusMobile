package com.tasknexus.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.CheckBox
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Preview
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.RssFeed
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.DrawerState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.tasknexus.navigation.Screen
import com.tasknexus.ui.theme.Accent
import com.tasknexus.ui.theme.BorderColor
import com.tasknexus.ui.theme.OnSurface
import com.tasknexus.ui.theme.OnSurface2
import com.tasknexus.ui.theme.OnSurface3
import com.tasknexus.ui.theme.Primary
import com.tasknexus.ui.theme.Surface
import com.tasknexus.ui.theme.Surface2
import com.tasknexus.ui.theme.Surface3
import kotlinx.coroutines.launch

// Maps Screen route to Material Icon
private fun iconForScreen(screen: Screen): ImageVector = when (screen) {
    Screen.Dashboard    -> Icons.Filled.Dashboard
    Screen.Notes        -> Icons.Filled.Description
    Screen.NoteEditor   -> Icons.Filled.Edit
    Screen.Todo         -> Icons.Filled.CheckBox
    Screen.Reminders    -> Icons.Filled.Notifications
    Screen.Timer        -> Icons.Filled.Timer
    Screen.Budget       -> Icons.Filled.AttachMoney
    Screen.QuickLinks   -> Icons.Filled.Link
    Screen.Calculator   -> Icons.Filled.Calculate
    Screen.Converter    -> Icons.Filled.SwapHoriz
    Screen.QRCode       -> Icons.Filled.QrCode
    Screen.Generators   -> Icons.Filled.AutoAwesome
    Screen.DateTime     -> Icons.Filled.Schedule
    Screen.ImageTools   -> Icons.Filled.Image
    Screen.Signature    -> Icons.Filled.Draw
    Screen.TextTools    -> Icons.Filled.TextFields
    Screen.DevTools     -> Icons.Filled.Code
    Screen.DataTesting  -> Icons.Filled.Science
    Screen.RSSFeeds     -> Icons.Filled.RssFeed
    Screen.SEOTools     -> Icons.Filled.Search
    Screen.NetworkTools -> Icons.Filled.Wifi
    Screen.PDFTools     -> Icons.Filled.PictureAsPdf
    Screen.PDFEditor    -> Icons.Filled.Edit
    Screen.CodeEditor   -> Icons.Filled.Terminal
    Screen.JSXPreview   -> Icons.Filled.Preview
    Screen.AIImageGen   -> Icons.Filled.AutoFixHigh
}

private data class DrawerGroup(
    val title: String,
    val items: List<Screen>
)

private val drawerGroups = listOf(
    DrawerGroup(
        title = "Overview",
        items = listOf(Screen.Dashboard)
    ),
    DrawerGroup(
        title = "Productivity",
        items = listOf(
            Screen.Notes,
            Screen.Todo,
            Screen.Reminders,
            Screen.Timer,
            Screen.Budget,
            Screen.QuickLinks
        )
    ),
    DrawerGroup(
        title = "Utilities",
        items = listOf(
            Screen.Calculator,
            Screen.Converter,
            Screen.QRCode,
            Screen.Generators,
            Screen.DateTime
        )
    ),
    DrawerGroup(
        title = "Tools",
        items = listOf(
            Screen.ImageTools,
            Screen.Signature,
            Screen.TextTools,
            Screen.DevTools,
            Screen.DataTesting,
            Screen.RSSFeeds,
            Screen.SEOTools,
            Screen.NetworkTools
        )
    ),
    DrawerGroup(
        title = "Coding",
        items = listOf(
            Screen.PDFTools,
            Screen.PDFEditor,
            Screen.CodeEditor,
            Screen.JSXPreview,
            Screen.AIImageGen
        )
    )
)

@Composable
fun AppDrawer(
    navController: NavController,
    drawerState: DrawerState
) {
    val scope = rememberCoroutineScope()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    ModalDrawerSheet(
        modifier = Modifier
            .width(300.dp)
            .fillMaxHeight(),
        drawerContainerColor = Surface,
        drawerContentColor = OnSurface
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
        ) {
            // Logo / Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(Primary, Accent)
                        )
                    )
                    .padding(horizontal = 20.dp, vertical = 28.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "TN",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "TaskNexus",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "All-in-one productivity",
                            color = Color.White.copy(alpha = 0.75f),
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Groups
            drawerGroups.forEachIndexed { groupIndex, group ->
                // Group header
                Text(
                    text = group.title.uppercase(),
                    color = OnSurface3,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(
                        start = 20.dp,
                        top = if (groupIndex == 0) 8.dp else 16.dp,
                        bottom = 4.dp
                    )
                )

                group.items.forEach { screen ->
                    val isActive = currentRoute == screen.route
                    DrawerItem(
                        screen = screen,
                        icon = iconForScreen(screen),
                        isActive = isActive,
                        onClick = {
                            scope.launch { drawerState.close() }
                            if (!isActive) {
                                navController.navigate(screen.route) {
                                    popUpTo(Screen.Dashboard.route) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }

                if (groupIndex < drawerGroups.lastIndex) {
                    HorizontalDivider(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        color = BorderColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun DrawerItem(
    screen: Screen,
    icon: ImageVector,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val bgColor = if (isActive) Primary.copy(alpha = 0.15f) else Color.Transparent
    val iconTint = if (isActive) Primary else OnSurface2
    val textColor = if (isActive) Primary else OnSurface2

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 2.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(bgColor)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        // Active indicator bar
        if (isActive) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(20.dp)
                    .clip(CircleShape)
                    .background(Primary)
            )
            Spacer(modifier = Modifier.width(10.dp))
        } else {
            Spacer(modifier = Modifier.width(13.dp))
        }

        Icon(
            imageVector = icon,
            contentDescription = screen.label,
            tint = iconTint,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = screen.label,
            color = textColor,
            fontSize = 14.sp,
            fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

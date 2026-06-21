package com.tasknexus.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.tasknexus.ui.screens.AIImageGenScreen
import com.tasknexus.ui.screens.BudgetScreen
import com.tasknexus.ui.screens.CalculatorScreen
import com.tasknexus.ui.screens.CodeEditorScreen
import com.tasknexus.ui.screens.ConverterScreen
import com.tasknexus.ui.screens.DashboardScreen
import com.tasknexus.ui.screens.DataTestingScreen
import com.tasknexus.ui.screens.DateTimeScreen
import com.tasknexus.ui.screens.DevToolsScreen
import com.tasknexus.ui.screens.GeneratorsScreen
import com.tasknexus.ui.screens.ImageToolsScreen
import com.tasknexus.ui.screens.JSXPreviewScreen
import com.tasknexus.ui.screens.NetworkToolsScreen
import com.tasknexus.ui.screens.NoteEditorScreen
import com.tasknexus.ui.screens.NotesScreen
import com.tasknexus.ui.screens.PDFEditorScreen
import com.tasknexus.ui.screens.PDFEditorScreen
import com.tasknexus.ui.screens.PDFToolsScreen
import com.tasknexus.ui.screens.QRCodeScreen
import com.tasknexus.ui.screens.QuickLinksScreen
import com.tasknexus.ui.screens.RSSFeedsScreen
import com.tasknexus.ui.screens.RemindersScreen
import com.tasknexus.ui.screens.SEOToolsScreen
import com.tasknexus.ui.screens.SignatureScreen
import com.tasknexus.ui.screens.TextToolsScreen
import com.tasknexus.ui.screens.TimerScreen
import com.tasknexus.ui.screens.TodoScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Dashboard.route
    ) {
        composable(Screen.Dashboard.route) {
            DashboardScreen(navController)
        }
        composable(Screen.Notes.route) {
            NotesScreen(navController)
        }
        composable(
            route = Screen.NoteEditor.route,
            arguments = listOf(
                navArgument("noteId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            NoteEditorScreen(
                navController = navController,
                noteId = backStackEntry.arguments?.getString("noteId")
            )
        }
        composable(Screen.Todo.route) {
            TodoScreen(navController)
        }
        composable(Screen.Reminders.route) {
            RemindersScreen(navController)
        }
        composable(Screen.Timer.route) {
            TimerScreen()
        }
        composable(Screen.Budget.route) {
            BudgetScreen()
        }
        composable(Screen.QuickLinks.route) {
            QuickLinksScreen()
        }
        composable(Screen.Calculator.route) {
            CalculatorScreen()
        }
        composable(Screen.Converter.route) {
            ConverterScreen()
        }
        composable(Screen.QRCode.route) {
            QRCodeScreen()
        }
        composable(Screen.Generators.route) {
            GeneratorsScreen()
        }
        composable(Screen.DateTime.route) {
            DateTimeScreen()
        }
        composable(Screen.ImageTools.route) {
            ImageToolsScreen()
        }
        composable(Screen.Signature.route) {
            SignatureScreen()
        }
        composable(Screen.TextTools.route) {
            TextToolsScreen()
        }
        composable(Screen.DevTools.route) {
            DevToolsScreen()
        }
        composable(Screen.DataTesting.route) {
            DataTestingScreen()
        }
        composable(Screen.RSSFeeds.route) {
            RSSFeedsScreen()
        }
        composable(Screen.SEOTools.route) {
            SEOToolsScreen()
        }
        composable(Screen.NetworkTools.route) {
            NetworkToolsScreen()
        }
        composable(Screen.PDFTools.route) {
            PDFToolsScreen()
        }
        composable(Screen.PDFEditor.route) {
            PDFEditorScreen()
        }
        composable(Screen.CodeEditor.route) {
            CodeEditorScreen()
        }
        composable(Screen.JSXPreview.route) {
            JSXPreviewScreen()
        }
        composable(Screen.AIImageGen.route) {
            AIImageGenScreen()
        }
    }
}

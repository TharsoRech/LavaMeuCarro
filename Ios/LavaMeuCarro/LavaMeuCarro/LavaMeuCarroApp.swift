//
//  LavaMeuCarroApp.swift
//  LavaMeuCarro
//
//  Created by Tharso francisco Rech curia on 15/06/26.
//

import SwiftUI
import CoreData

@main
struct LavaMeuCarroApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}

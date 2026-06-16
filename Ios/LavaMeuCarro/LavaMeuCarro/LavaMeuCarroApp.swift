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
    
    // 1. Instancia o gerenciador de fluxo global aqui na raiz do ciclo de vida do app
    @State private var flowManager = AppFlowManager()

    var body: some Scene {
        WindowGroup {
            // 2. Troca HomePage por RootView, injetando o flowManager
            RootView(flowManager: flowManager)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}

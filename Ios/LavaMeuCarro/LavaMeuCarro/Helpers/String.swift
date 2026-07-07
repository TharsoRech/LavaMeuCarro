extension String {
    func formattedAsPhone() -> String {
            let digits = self.filter { $0.isNumber }
            
            if digits.count <= 2 {
                return digits
            }
            
            let maxDigits = min(digits.count, 11)
            let cleanDigits = String(digits.prefix(maxDigits))
            
            var result = ""
            
            for (index, char) in cleanDigits.enumerated() {
                if index == 0 {
                    result.append("(\(char)")
                } else if index == 1 {
                    result.append("\(char)) ")
                } else if index == 6 && cleanDigits.count <= 10 {
                    result.append("-\(char)")
                } else if index == 7 && cleanDigits.count > 10 {
                    result.append("-\(char)")
                } else {
                    result.append(char)
                }
            }
            
            return result
        }
    
    func formattedAsDob() -> String {
            let digits = self.filter { $0.isNumber }
            
            let maxDigits = min(digits.count, 8)
            let cleanDigits = String(digits.prefix(maxDigits))
            
            var result = ""
            
            for (index, char) in cleanDigits.enumerated() {
                if index == 2 || index == 4 {
                    result.append("/\(char)")
                } else {
                    result.append(char)
                }
            }
            
            return result
        }
    
    func formattedAsCpf() -> String {
            let digits = self.filter { $0.isNumber }
            
            let maxDigits = min(digits.count, 11)
            let cleanDigits = String(digits.prefix(maxDigits))
            
            var result = ""
            
            for (index, char) in cleanDigits.enumerated() {
                if index == 3 || index == 6 {
                    result.append(".\(char)")
                } else if index == 9 {
                    result.append("-\(char)")
                } else {
                    result.append(char)
                }
            }
            
            return result
        }
    
}

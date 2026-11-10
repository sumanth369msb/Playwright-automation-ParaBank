# HighLevel Live Coding & Problem-Solving Mastery

**Goal:** Bulletproof live coding performance for HighLevel SDET interviews.  
**Focus:** The top 5 SDET coding patterns frequently asked in Product/CRM company interviews (Implemented in Java).

---

## 1. The 4-Step Live Coding Communication Template

Whenever the interviewer gives you a coding problem, follow this exact ritual:

1. **Clarify Inputs & Edge Cases (First 60 seconds):**
   - *"Can the input string/array be empty or null?"*
   - *"Are characters ASCII or lowercase only?"*
   - *"Should I return indices or values?"*
2. **State the Brute Force & Complexity:**
   - *"The naive approach is nested loops with $O(N^2)$ time. But we can optimize to $O(N)$ using a HashMap / Two Pointers."*
3. **Write Clean, Idiomatic Code While Talking:**
   - Narrate what you are doing: *"I am initializing a HashMap here to store the characters..."*
4. **Dry Run with an Example Before Saying You're Done:**
   - Step through the code line by line with a small example (e.g. `[2, 7, 11]`, `target = 9`) to prove it works before running tests!

---

## 2. Top 5 SDET Live Coding Problems (Java)

### Problem 1: Two Sum (Hash Map $O(N)$)
```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Map to store value -> index
        Map<Integer, Integer> seen = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}
```

### Problem 2: Valid Anagram (Frequency Count $O(N)$)
*Pro Tip: Using a 26-size integer array instead of a HashMap is much faster and shows you understand memory efficiency.*
```java
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        
        int[] count = new int[26];
        
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++; // Increment for string s
            count[t.charAt(i) - 'a']--; // Decrement for string t
        }
        
        // If they are anagrams, all counts should be exactly 0
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }
}
```

### Problem 3: Valid Parentheses / JSON Bracket Validation (Stack $O(N)$)
*Very common for SDETs validating JSON API payloads!*
```java
import java.util.Stack;

class Solution {
    public boolean isValidBrackets(String s) {
        Stack<Character> stack = new Stack<>();
        
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                
                // Check if the closing bracket matches the top of the stack
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}
```

### Problem 4: Find Longest Substring Without Repeating Characters (Sliding Window $O(N)$)
```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> charIndex = new HashMap<>();
        int maxLen = 0;
        int start = 0;
        
        for (int end = 0; end < s.length(); end++) {
            char c = s.charAt(end);
            
            // If we've seen the character and it's inside our current window
            if (charIndex.containsKey(c) && charIndex.get(c) >= start) {
                start = charIndex.get(c) + 1; // Shrink window from the left
            }
            
            charIndex.put(c, end); // Update the latest index of the character
            maxLen = Math.max(maxLen, end - start + 1);
        }
        
        return maxLen;
    }
}
```

### Problem 5: Group Anagrams (HashMap with Sorted Array Key $O(N \cdot K \log K)$)
```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> grouped = new HashMap<>();
        
        for (String word : strs) {
            // Sort the string characters to use as a HashMap key
            char[] chars = word.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            
            // Add the original word to the list for this sorted key
            if (!grouped.containsKey(key)) {
                grouped.put(key, new ArrayList<>());
            }
            grouped.get(key).add(word);
        }
        
        return new ArrayList<>(grouped.values());
    }
}
```

pub fn intersection_len<T: PartialEq + Clone>(arr1: &[T], arr2: &[T]) -> usize {
    let mut res = 0;
    for x in arr1 {
        if arr2.contains(x) {
            res += 1;
        }
    }
    res
}

pub fn union_len<T: PartialEq + Clone>(arr1: &[T], arr2: &[T]) -> usize {
    let mut res = arr1.len();
    for x in arr2 {
        if !arr1.contains(x) {
            res += 1;
        }
    }
    res
}

pub fn uniq<T: PartialEq + Clone>(arr: &[T]) -> Vec<T> {
    let mut res = vec![];
    for x in arr {
        if !res.contains(x) {
            res.push(x.clone());
        }
    }
    res
}

pub fn min(arr: &[usize]) -> usize {
    let mut min = arr[0];
    for x in arr {
        if *x < min {
            min = *x;
        }
    }
    min
}

pub fn abs(n: i32) -> i32 {
    if n < 0 {
        -n
    } else {
        n
    }
}

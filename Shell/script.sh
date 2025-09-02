x=12
y=24

echo "$x + $y = $(($x + $y))"


someJs="console.log('Hello world Javascript')"
somePython="print('Hello world Python')"

echo "$someJs" | tee output.js | node
echo "$somePython" | tee output.py | python3.13

res=$(cd /home/jano && ls)

echo "$res"

cat output.js
cat output.py

myfunc() {
    echo "Hello from myfunc with $1 variable."
} 

cd /home/jano  



ll
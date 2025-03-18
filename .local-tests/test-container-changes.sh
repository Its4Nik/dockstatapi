commands=("kill" "start" "restart" "start" "pause" "unpause")
container="SQLite-web"

press(){
	echo "Press enter to continue"
	read -r -p ">"
}

for command in "${commands[@]}"; do
    press
    echo "Running $command for $container"
    docker "$command" "$container"
done

docker start "$container"

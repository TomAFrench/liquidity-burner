# This process is required as React only will listen to env variables at build time so we pass them in through nginx
# see: https://www.manifold.co/blog/building-a-production-grade-container-for-your-static-javascript-application-b2b2eff83fbd

NGINX_SUB_FILTER=$(cat .env.production | grep '=' | sort | sed -e 's/REACT_APP_\([a-zA-Z_]*\)=\(.*\)/sub_filter\ \"NGINX_REPLACE_\1\" \"$\{\1\}\";/')

cat nginx.conf.sample | sed -e "s|LOCATION_SUB_FILTER|$(echo $NGINX_SUB_FILTER)|" | sed 's|}";\ |}";\n\t\t|g' > nginx.conf.sample

envsubst < nginx.conf.sample > default.conf

nginx -g "daemon off;"
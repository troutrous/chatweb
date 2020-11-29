export const setCookie = (cname, cvalue) => {
    // var d = new Date();
    // d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    // var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue;
}

export const getCookie = (cname) => {
    const cookieValue = document.cookie
        .split(';')
        .find(row => row.startsWith(cname));
    return cookieValue ? cookieValue.split('=')[1] : null;
}